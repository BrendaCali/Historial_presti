import { bytesToHex, hexToBytes, numberToHex, toHex } from 'viem';
/** Orden del grupo de la curva P-256. */
export const P256_N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;
const P256_HALF_N = P256_N / 2n;
/**
 * Convierte una firma DER en `r` y `s` de 32 bytes, con `s` en la mitad baja de la curva.
 * (r, s) y (r, n - s) son igual de válidas, pero los contratos solo aceptan la forma baja para evitar
 * maleabilidad, y los autenticadores entregan cualquiera de las dos al azar.
 */
export function derToRS(der) {
    if (der.length < 8 || der[0] !== 0x30)
        throw new Error('Firma DER inválida');
    let i = 2;
    // Una longitud mayor a 127 usa varios bytes; las firmas P-256 caben en uno.
    if ((der[1] ?? 0) > 0x80)
        i += der[1] - 0x80;
    const leerEntero = () => {
        if (der[i] !== 0x02)
            throw new Error('Firma DER inválida');
        const largo = der[i + 1];
        if (largo === undefined || largo === 0 || i + 2 + largo > der.length)
            throw new Error('Firma DER inválida');
        const valor = BigInt(bytesToHex(der.slice(i + 2, i + 2 + largo)));
        i += 2 + largo;
        return valor;
    };
    const r = leerEntero();
    const s = leerEntero();
    if (r <= 0n || r >= P256_N || s <= 0n || s >= P256_N)
        throw new Error('Firma fuera de rango');
    const sBajo = s > P256_HALF_N ? P256_N - s : s;
    return { r: numberToHex(r, { size: 32 }), s: numberToHex(sBajo, { size: 32 }) };
}
/** Arma los parámetros que esperan los contratos a partir de lo que devolvió el autenticador. */
export function buildAuth(assertion) {
    const clientDataJSON = new TextDecoder().decode(assertion.clientDataJSON);
    const challengeIndex = clientDataJSON.indexOf('"challenge":"');
    const typeIndex = clientDataJSON.indexOf('"type":"webauthn.get"');
    if (challengeIndex < 0)
        throw new Error('clientDataJSON sin challenge');
    if (typeIndex < 0)
        throw new Error('clientDataJSON no es una aserción webauthn.get');
    const { r, s } = derToRS(assertion.signature);
    return {
        r,
        s,
        challengeIndex: BigInt(challengeIndex),
        typeIndex: BigInt(typeIndex),
        authenticatorData: bytesToHex(assertion.authenticatorData),
        clientDataJSON,
    };
}
/** Base64url sin relleno, como lo escribe WebAuthn en `clientDataJSON`. */
export function toBase64Url(bytes) {
    let binario = '';
    for (const b of bytes)
        binario += String.fromCharCode(b);
    return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function fromBase64Url(texto) {
    const b64 = texto.replace(/-/g, '+').replace(/_/g, '/');
    const relleno = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return Uint8Array.from(atob(relleno), (c) => c.charCodeAt(0));
}
/** Autenticador del navegador: pide una aserción con `navigator.credentials.get`. */
export const browserAssertion = async ({ credentialId, challenge, rpId }) => {
    const credentials = globalThis.navigator?.credentials;
    if (!credentials)
        throw new Error('Este entorno no tiene WebAuthn; pasa un `assertionProvider` propio');
    const credencial = (await credentials.get({
        publicKey: {
            challenge: challenge,
            userVerification: 'required',
            ...(rpId ? { rpId } : {}),
            ...(credentialId
                ? { allowCredentials: [{ type: 'public-key', id: fromBase64Url(credentialId) }] }
                : {}),
        },
    }));
    if (!credencial)
        throw new Error('La passkey no respondió');
    const respuesta = credencial.response;
    return {
        authenticatorData: new Uint8Array(respuesta.authenticatorData),
        clientDataJSON: new Uint8Array(respuesta.clientDataJSON),
        signature: new Uint8Array(respuesta.signature),
    };
};
/** Convierte una clave pública SPKI (`AuthenticatorAttestationResponse.getPublicKey()`) en x e y. */
export async function publicKeyFromSpki(spki) {
    const llave = await crypto.subtle.importKey('spki', spki, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
    const cruda = new Uint8Array(await crypto.subtle.exportKey('raw', llave));
    return { x: bytesToHex(cruda.slice(1, 33)), y: bytesToHex(cruda.slice(33, 65)) };
}
export { hexToBytes, toHex };
//# sourceMappingURL=webauthn.js.map