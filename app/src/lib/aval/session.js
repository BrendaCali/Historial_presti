// ATRIBUCIÓN: adaptado de apps/demo/src/lib/session.ts de Aval (github.com/Alan021011/Aval), de Alan Meneces: es la forma
// correcta de integrar Mera con el SDK de Aval y se portó de TypeScript a JavaScript con cambios mínimos.

import { createPasskeyWithPrfOutput, createSecp256k1SigningSession, getEvmAddress, getPasskeyPrfOutput } from '@category-labs/mera';
import { toViemAccount } from '@category-labs/mera/viem';
import { HDKey } from '@scure/bip32';
import { entropyToMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { derivarEspacios } from '../memoria';

// Sesión de la cuenta del usuario. La cuenta sale de la passkey con Mera (PRF -> BIP-39 -> BIP-44): la misma
// passkey da siempre la misma cuenta, en cualquier dispositivo, sin guardar nada. Mientras la sesión está abierta se
// firma sin pedir la huella; al cerrarla (`end`) la clave desaparece de la memoria.

const rpId = () => window.location.hostname;

async function openSession(prfOutput, credentialId) {
  const mnemonic = entropyToMnemonic(prfOutput, wordlist);
  const node = HDKey.fromMasterSeed(mnemonicToSeedSync(mnemonic)).derive("m/44'/60'/0'/0/0");
  if (!node.privateKey) throw new Error('No se pudo derivar la cuenta');
  const session = createSecp256k1SigningSession({ privateKey: node.privateKey });
  // De la misma passkey salen más claves que NO son de cuenta (memoria cifrada del asistente). La salida PRF no se guarda.
  const memoria = await derivarEspacios(prfOutput);
  return {
    address: getEvmAddress(session.publicKey),
    account: toViemAccount(session),
    credentialId,
    memoria,
    end: () => session.end(),
  };
}

// Cuenta nueva con UNA sola ceremonia de passkey. Devuelve también la clave P256 de esa passkey.
export async function createAccount(backend, name) {
  const created = await createPasskeyWithPrfOutput({
    rp: { id: rpId(), name: 'Preste' },
    user: { name, displayName: name },
    webAuthnClient: backend.webAuthnClient,
  });
  const publicKey = backend.capturedKey();
  if (!publicKey) throw new Error('No se pudo leer la clave de la passkey');
  return { session: await openSession(created.prfOutput, created.credentialId), publicKey };
}

// Entra con una passkey existente: una ceremonia, y todo el estado se reconstruye desde la cadena.
export async function signIn(backend) {
  const { credentialId, prfOutput } = await getPasskeyPrfOutput({ rpId: rpId(), webAuthnClient: backend.webAuthnClient });
  return await openSession(prfOutput, credentialId);
}
