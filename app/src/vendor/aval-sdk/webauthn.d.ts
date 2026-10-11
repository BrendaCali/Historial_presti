import { hexToBytes, type Hex, toHex } from 'viem';
/** Parámetros de una aserción WebAuthn tal como los espera `WebAuthn.verify` de OpenZeppelin en los contratos. */
export type WebAuthnAuth = {
    r: Hex;
    s: Hex;
    challengeIndex: bigint;
    typeIndex: bigint;
    authenticatorData: Hex;
    clientDataJSON: string;
};
/** Lo que entrega un autenticador al firmar: es independiente de dónde corra (navegador, Node, pruebas). */
export type RawAssertion = {
    authenticatorData: Uint8Array;
    clientDataJSON: Uint8Array;
    /** Firma ECDSA P-256 en formato DER, como la devuelve WebAuthn. */
    signature: Uint8Array;
};
/** Pide a un autenticador que firme `challenge`. La implementación por defecto usa el navegador. */
export type AssertionProvider = (request: {
    credentialId?: string;
    challenge: Uint8Array;
    rpId?: string;
}) => Promise<RawAssertion>;
/** Orden del grupo de la curva P-256. */
export declare const P256_N = 115792089210356248762697446949407573529996955224135760342422259061068512044369n;
/**
 * Convierte una firma DER en `r` y `s` de 32 bytes, con `s` en la mitad baja de la curva.
 * (r, s) y (r, n - s) son igual de válidas, pero los contratos solo aceptan la forma baja para evitar
 * maleabilidad, y los autenticadores entregan cualquiera de las dos al azar.
 */
export declare function derToRS(der: Uint8Array): {
    r: Hex;
    s: Hex;
};
/** Arma los parámetros que esperan los contratos a partir de lo que devolvió el autenticador. */
export declare function buildAuth(assertion: RawAssertion): WebAuthnAuth;
/** Base64url sin relleno, como lo escribe WebAuthn en `clientDataJSON`. */
export declare function toBase64Url(bytes: Uint8Array): string;
export declare function fromBase64Url(texto: string): Uint8Array<ArrayBuffer>;
/** Autenticador del navegador: pide una aserción con `navigator.credentials.get`. */
export declare const browserAssertion: AssertionProvider;
/** Clave pública P-256 en la forma que guarda `PasskeyRegistry`. */
export type PasskeyPublicKey = {
    x: Hex;
    y: Hex;
};
/** Convierte una clave pública SPKI (`AuthenticatorAttestationResponse.getPublicKey()`) en x e y. */
export declare function publicKeyFromSpki(spki: ArrayBuffer): Promise<PasskeyPublicKey>;
export { hexToBytes, toHex };
