// Memoria cifrada del asistente: usa la salida PRF de la huella (Mera) para algo que NO es firmar con una cuenta.
//
// De la MISMA passkey salen claves independientes, una por "espacio de nombres" (HKDF-SHA256 con una etiqueta
// distinta por uso). Conocer una no revela las otras, ni la clave de la cuenta:
//   preste/memoria/clave/v1  -> clave AES-GCM que cifra la memoria (no extraíble del navegador)
//   preste/memoria/id/v1     -> identificador anónimo donde se guarda el texto cifrado. NO es la dirección de la
//                               cuenta ni se puede ligar a ella: el servidor no sabe de quién es cada memoria.
//
// Nada sensible se guarda en claro: el servidor solo ve (id, texto cifrado). Con la misma huella, en otro
// dispositivo o en un navegador nuevo, se vuelven a derivar las mismas dos claves y la memoria se descifra.

const enc = new TextEncoder();
const dec = new TextDecoder();
const SAL_APP = enc.encode('preste/hkdf/v1');

export const ESPACIOS = {
  clave: 'preste/memoria/clave/v1',
  id: 'preste/memoria/id/v1',
};

const hex = (b) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
const aB64 = (b) => btoa(String.fromCharCode(...b));
const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function hkdfBits(raiz, etiqueta, bits = 256) {
  return new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: SAL_APP, info: enc.encode(etiqueta) }, raiz, bits),
  );
}

// Deriva los dos espacios a partir de la salida PRF. La salida PRF no se guarda: vive solo durante esta llamada.
export async function derivarEspacios(prfOutput) {
  const raiz = await crypto.subtle.importKey('raw', prfOutput, 'HKDF', false, ['deriveBits']);
  const id = hex(await hkdfBits(raiz, ESPACIOS.id));
  const claveCruda = await hkdfBits(raiz, ESPACIOS.clave);
  const clave = await crypto.subtle.importKey('raw', claveCruda, 'AES-GCM', false, ['encrypt', 'decrypt']);
  claveCruda.fill(0);
  return { id, clave };
}

// Cifra un objeto. El id va como dato autenticado: un texto cifrado de otra memoria no se puede pasar por esta.
export async function cifrar({ id, clave }, datos) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(id) }, clave, enc.encode(JSON.stringify(datos))),
  );
  return { v: 1, iv: aB64(iv), ct: aB64(ct) };
}

export async function descifrar({ id, clave }, sobre) {
  if (sobre?.v !== 1) throw new Error('Formato de memoria desconocido');
  const claro = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: deB64(sobre.iv), additionalData: enc.encode(id) },
    clave,
    deB64(sobre.ct),
  );
  return JSON.parse(dec.decode(claro));
}
