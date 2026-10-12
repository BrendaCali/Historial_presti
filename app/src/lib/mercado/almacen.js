import { get, put } from '@vercel/blob';
import { ErrorMercado, estadoVacio } from './logica';

// Guarda TODO el estado del mercado (ofertas, tratos, saldos, calificaciones) como un solo documento en Vercel Blob
// (privado). Cada cambio es una transacción con control de concurrencia: se lee con su ETag y se escribe solo si nadie
// lo cambió en el medio (ifMatch); si hubo choque, se repite. Así dos personas actuando a la vez no se pisan.
// Sin BLOB_READ_WRITE_TOKEN (desarrollo sin almacén) usa la memoria del proceso, que se pierde al reiniciar.

const conBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
// Producción y desarrollo no comparten datos: cada entorno tiene su propio documento.
const RUTA = `estado/${process.env.VERCEL_ENV ?? 'local'}.json`;
const memoria = (globalThis.__mercadoMemoria ??= { estado: null, etag: 0 });
const choque = (e) => /precondition|etag|already exists|412|conflict/i.test(`${e?.message} ${e?.name}`);

export async function leer() {
  if (!conBlob()) return { estado: structuredClone(memoria.estado ?? estadoVacio()), etag: memoria.etag };
  const r = await get(RUTA, { access: 'private', useCache: false });
  if (!r || r.statusCode === 404) return { estado: estadoVacio(), etag: null };
  return { estado: JSON.parse(await new Response(r.stream).text()), etag: String(r.blob.etag).replace(/^W\//, '') };
}

async function escribir(estado, etag) {
  if (!conBlob()) {
    if (memoria.etag !== etag && !(etag === 0 && memoria.estado === null)) throw Object.assign(new Error('precondition failed'), { name: 'Choque' });
    memoria.estado = structuredClone(estado);
    memoria.etag += 1;
    return;
  }
  await put(RUTA, JSON.stringify(estado), {
    access: 'private', addRandomSuffix: false, contentType: 'application/json',
    ...(etag ? { ifMatch: etag } : { allowOverwrite: false }),
  });
}

// fn(estado) modifica una copia y devuelve el resultado. Si lanza ErrorMercado, no se guarda nada.
export async function transaccion(fn, intentos = 14) {
  let ultimo;
  for (let i = 0; i < intentos; i++) {
    const { estado, etag } = await leer();
    const copia = structuredClone(estado);
    const resultado = await fn(copia);
    try {
      await escribir(copia, etag);
      return resultado;
    } catch (e) {
      if (e instanceof ErrorMercado) throw e;
      if (!choque(e)) throw e;
      ultimo = e;
      await new Promise((r) => setTimeout(r, 60 + Math.random() * Math.min(900, 120 * (i + 1))));
    }
  }
  throw new ErrorMercado('Ocupado', `Mucha actividad al mismo tiempo. Inténtalo de nuevo. (${ultimo?.message ?? ''})`);
}
