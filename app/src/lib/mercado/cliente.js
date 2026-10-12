import { mensajePeticion, mensajeQR } from './mensajes';

// Cliente del mercado: firma cada petición con la cuenta de Mera (sin ventanas de huella) y llama a /api/mercado.
const hex = (b) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
const sha256 = async (t) => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t))));

export class ErrorApi extends Error {
  constructor(mensaje, codigo, status) {
    super(mensaje);
    this.codigo = codigo;
    this.status = status;
  }
}

// Arma una petición firmada con la cuenta (sin ventanas de huella). Sirve para el mercado y para el asistente.
export async function construirPeticion(cuenta, accion, datos = {}) {
  const cuerpo = JSON.stringify(datos);
  const ts = Date.now();
  const nonce = hex(crypto.getRandomValues(new Uint8Array(12)));
  const firma = await cuenta.signMessage({ message: mensajePeticion({ accion, addr: cuenta.address, ts, nonce, hashCuerpo: await sha256(cuerpo) }) });
  return { accion, addr: cuenta.address, ts, nonce, cuerpo, firma };
}

export async function llamarMercado(cuenta, accion, datos = {}) {
  const r = await fetch('/api/mercado', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(await construirPeticion(cuenta, accion, datos)),
    cache: 'no-store',
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new ErrorApi(j.error ?? 'No se pudo completar la acción.', j.codigo, r.status);
  return j.datos;
}

// Código QR de calificación (dura 2 minutos en el servidor; en pantalla se renueva cada 30 s).
export async function generarCodigoQR(cuenta) {
  const t = Math.floor(Date.now() / 1000);
  const n = hex(crypto.getRandomValues(new Uint8Array(8)));
  const f = await cuenta.signMessage({ message: mensajeQR({ a: cuenta.address, t, n }) });
  return JSON.stringify({ a: cuenta.address, t, n, f });
}
