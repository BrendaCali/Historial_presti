import { createHash } from 'node:crypto';
import { isAddress, recoverMessageAddress } from 'viem';
import { ErrorMercado } from './logica';
import { mensajePeticion, mensajeQR } from './mensajes';

// Cada petición va FIRMADA con la cuenta de Mera del usuario (firma sin ventanas, con la sesión abierta). El servidor
// recupera la dirección de la firma: no hay contraseñas ni tokens, y nadie puede actuar a nombre de otra cuenta.
// El mensaje liga la acción, la cuenta, la hora, un nonce de un solo uso y el contenido exacto de la petición.

const VENTANA_MS = 120_000;
const sha256 = (t) => createHash('sha256').update(t).digest('hex');

export async function verificarPeticion(p, ahora = Date.now()) {
  const { accion, addr, ts, nonce, cuerpo, firma } = p ?? {};
  if (typeof accion !== 'string' || typeof cuerpo !== 'string' || typeof firma !== 'string' || !isAddress(addr) || typeof nonce !== 'string') {
    throw new ErrorMercado('Invalido', 'Petición mal formada.');
  }
  if (!/^[0-9a-f]{16,64}$/.test(nonce)) throw new ErrorMercado('Invalido', 'Petición mal formada.');
  if (!Number.isFinite(ts) || Math.abs(ahora - ts) > VENTANA_MS) {
    throw new ErrorMercado('Reloj', 'La hora de tu dispositivo no coincide con la del servidor. Revisa tu reloj e inténtalo de nuevo.');
  }
  let firmante;
  try {
    firmante = await recoverMessageAddress({ message: mensajePeticion({ accion, addr, ts, nonce, hashCuerpo: sha256(cuerpo) }), signature: firma });
  } catch {
    throw new ErrorMercado('Firma', 'La firma no es válida.');
  }
  if (firmante.toLowerCase() !== String(addr).toLowerCase()) throw new ErrorMercado('Firma', 'La firma no corresponde a tu cuenta.');
  let datos;
  try { datos = JSON.parse(cuerpo); } catch { throw new ErrorMercado('Invalido', 'Petición mal formada.'); }
  return { accion, quien: firmante.toLowerCase(), datos, nonce };
}

export async function verificarQR(codigo) {
  const { a, t, n, f } = codigo ?? {};
  if (!isAddress(a) || !Number.isFinite(t) || typeof n !== 'string' || typeof f !== 'string' || !/^[0-9a-f]{8,32}$/.test(n)) {
    throw new ErrorMercado('CodigoInvalido', 'El código no es válido.');
  }
  let firmante;
  try { firmante = await recoverMessageAddress({ message: mensajeQR({ a, t, n }), signature: f }); } catch {
    throw new ErrorMercado('CodigoInvalido', 'El código no es válido.');
  }
  if (firmante.toLowerCase() !== a.toLowerCase()) throw new ErrorMercado('CodigoInvalido', 'El código no es válido.');
  return { a: a.toLowerCase(), t, n };
}
