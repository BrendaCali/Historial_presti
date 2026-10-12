// ATRIBUCIÓN: adaptado de apps/demo/src/lib/passkey.ts de Aval (github.com/Alan021011/Aval), de Alan Meneces: es la forma
// correcta de integrar Mera con el SDK de Aval y se portó de TypeScript a JavaScript con cambios mínimos.

import { bytesToHex } from 'viem';
import { browserAssertion, toBase64Url } from '../../vendor/aval-sdk/index.js';

// Una "passkey" para la app: lo que Mera necesita para crear la cuenta, lo que el SDK necesita para pedir
// aprobaciones, y la clave pública P256 que se captura en la MISMA ceremonia en la que se crea.
//  - real: la passkey del dispositivo (huella, rostro o PIN) con la extensión PRF.
//  - simulated: clave de software guardada en este navegador, para dispositivos sin PRF y para probar sin
//    autenticador. NO es una passkey real y no cumple la prueba stateless: la app lo avisa.

const ES256 = -7;
const rpId = () => window.location.hostname;

const bytes = (source) =>
  source instanceof ArrayBuffer ? new Uint8Array(source) : new Uint8Array(source.buffer, source.byteOffset, source.byteLength).slice();

export function realBackend() {
  let key = null;
  let prompts = 0;

  const webAuthnClient = {
    async createCredential(req) {
      prompts++;
      const cred = await navigator.credentials.create({
        publicKey: {
          rp: req.rp,
          user: req.user,
          challenge: req.challenge,
          // Solo ES256: el precompile de Monad verifica P256, no RSA.
          pubKeyCredParams: [{ type: 'public-key', alg: ES256 }],
          ...(req.timeout !== undefined ? { timeout: req.timeout } : {}),
          attestation: req.attestation,
          authenticatorSelection: {
            residentKey: req.residentKey,
            requireResidentKey: true,
            userVerification: req.userVerification,
          },
          extensions: { prf: { eval: { first: req.prfSalt } } },
        },
      });
      if (!cred) throw new Error('La passkey no se creó');

      const response = cred.response;
      if (typeof response.getPublicKey !== 'function') throw new Error('Este navegador no expone la clave de la passkey');
      if (response.getPublicKeyAlgorithm() !== ES256) throw new Error('La passkey no usa P256 (ES256)');
      const spki = response.getPublicKey();
      if (!spki) throw new Error('La passkey no devolvió clave pública');
      const imported = await crypto.subtle.importKey('spki', spki, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
      const raw = new Uint8Array(await crypto.subtle.exportKey('raw', imported));
      key = { x: bytesToHex(raw.slice(1, 33)), y: bytesToHex(raw.slice(33, 65)) };

      const prf = cred.getClientExtensionResults().prf;
      const first = prf?.results?.first;
      const transports = response.getTransports?.();
      return {
        credentialId: new Uint8Array(cred.rawId),
        ...(transports ? { transports } : {}),
        prfEnabled: prf?.enabled === true,
        ...(first ? { prfOutput: bytes(first) } : {}),
      };
    },

    async getCredential(req) {
      prompts++;
      const allowed = req.allowCredential;
      const cred = await navigator.credentials.get({
        publicKey: {
          rpId: req.rpId,
          challenge: req.challenge,
          ...(req.timeout !== undefined ? { timeout: req.timeout } : {}),
          userVerification: req.userVerification,
          extensions: { prf: { eval: { first: req.prfSalt } } },
          ...(allowed
            ? { allowCredentials: [{ type: 'public-key', id: allowed.credentialId, ...(allowed.transports ? { transports: allowed.transports } : {}) }] }
            : {}),
        },
      });
      if (!cred) throw new Error('La passkey no respondió');
      const first = cred.getClientExtensionResults().prf?.results?.first;
      return { credentialId: new Uint8Array(cred.rawId), ...(first ? { prfOutput: bytes(first) } : {}) };
    },
  };

  const assertionProvider = (request) => {
    prompts++;
    return browserAssertion({ ...request, rpId: rpId() });
  };

  return { mode: 'real', webAuthnClient, assertionProvider, capturedKey: () => key, prompts: () => prompts };
}

// ---------------------------------------------------------------------------------------------------------------------

// Solo para el modo de prueba: con "?u=ana" en la dirección se usa una ranura distinta, para probar dos personas a la vez.
function ranura() {
  try {
    const u = new URLSearchParams(location.search).get('u');
    if (u) sessionStorage.setItem('preste.sim.u', u.replace(/[^a-z0-9]/gi, '').slice(0, 12));
    return sessionStorage.getItem('preste.sim.u') ?? '';
  } catch {
    return '';
  }
}
const clave = () => `preste.simulated-passkey.v1${ranura() ? `.${ranura()}` : ''}`;

const toHex = (data) => bytesToHex(data).slice(2);
const fromHex = (text) => Uint8Array.from(text.match(/../g)?.map((b) => parseInt(b, 16)) ?? []);
const fromB64Url = (v) => Uint8Array.from(atob(v.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

function load() {
  try {
    const raw = localStorage.getItem(clave());
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const hasSimulatedAccount = () => load() !== null;
export const forgetSimulatedAccount = () => {
  try {
    localStorage.removeItem(clave());
  } catch {
    // sin almacenamiento: nada que borrar
  }
};

// Firma ECDSA de WebCrypto (r ‖ s, 64 bytes) -> DER, que es lo que entrega un autenticador real.
function rawToDer(raw) {
  const integer = (part) => {
    let start = 0;
    while (start < part.length - 1 && part[start] === 0) start++;
    const value = part.slice(start);
    const padded = (value[0] ?? 0) & 0x80 ? Uint8Array.from([0, ...value]) : value;
    return Uint8Array.from([0x02, padded.length, ...padded]);
  };
  const r = integer(raw.slice(0, 32));
  const s = integer(raw.slice(32, 64));
  return Uint8Array.from([0x30, r.length + s.length, ...r, ...s]);
}

const publicKeyOf = (privateKey) => ({ x: bytesToHex(fromB64Url(privateKey.x)), y: bytesToHex(fromB64Url(privateKey.y)) });

export function simulatedBackend() {
  let key = null;
  let prompts = 0;

  const prf = async (secret, salt) => {
    const hmac = await crypto.subtle.importKey('raw', fromHex(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return new Uint8Array(await crypto.subtle.sign('HMAC', hmac, salt));
  };

  const webAuthnClient = {
    async createCredential(req) {
      prompts++;
      const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
      const privateKey = await crypto.subtle.exportKey('jwk', pair.privateKey);
      const credentialId = crypto.getRandomValues(new Uint8Array(32));
      const secret = toHex(crypto.getRandomValues(new Uint8Array(32)));
      localStorage.setItem(clave(), JSON.stringify({ secret, privateKey, credentialId: toBase64Url(credentialId) }));
      key = publicKeyOf(privateKey);
      return { credentialId, prfEnabled: true, prfOutput: await prf(secret, req.prfSalt) };
    },

    async getCredential(req) {
      prompts++;
      const stored = load();
      if (!stored) throw new Error('No hay una cuenta de prueba en este navegador.');
      return { credentialId: fromB64Url(stored.credentialId), prfOutput: await prf(stored.secret, req.prfSalt) };
    },
  };

  const assertionProvider = async ({ challenge }) => {
    prompts++;
    const stored = load();
    if (!stored) throw new Error('No hay una cuenta de prueba en este navegador.');
    const clientDataJSON = new TextEncoder().encode(
      JSON.stringify({ type: 'webauthn.get', challenge: toBase64Url(challenge), origin: window.location.origin, crossOrigin: false }),
    );
    const rpHash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rpId())));
    // sha256(rpId) ‖ banderas (usuario presente + verificado) ‖ contador
    const authenticatorData = Uint8Array.from([...rpHash, 0x05, 0, 0, 0, 0]);
    const clientHash = new Uint8Array(await crypto.subtle.digest('SHA-256', clientDataJSON));
    const signingKey = await crypto.subtle.importKey('jwk', stored.privateKey, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    // WebAuthn firma authenticatorData ‖ sha256(clientDataJSON); ECDSA aplica el sha256 final.
    const raw = new Uint8Array(
      await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, signingKey, Uint8Array.from([...authenticatorData, ...clientHash])),
    );
    return { authenticatorData, clientDataJSON, signature: rawToDer(raw) };
  };

  return { mode: 'simulated', webAuthnClient, assertionProvider, capturedKey: () => key, prompts: () => prompts };
}
