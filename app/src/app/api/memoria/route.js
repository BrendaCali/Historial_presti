import { del, get, put } from '@vercel/blob';

// Almacén de la memoria cifrada del asistente. El servidor NO puede leerla: solo guarda (id, texto cifrado).
// El id sale de la huella del usuario (espacio preste/memoria/id/v1), no es su dirección y no se puede ligar a ella.
// Con BLOB_READ_WRITE_TOKEN (Vercel Blob, privado) persiste entre dispositivos; sin él, usa memoria volátil del proceso
// (solo para desarrollo: se pierde al reiniciar).

const ID_VALIDO = /^[0-9a-f]{64}$/;
const MAX_BYTES = 128 * 1024;
const volatil = (globalThis.__memoriaVolatil ??= new Map());
const conBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const ruta = (id) => `memoria/${id}.json`;
const sinCache = { 'cache-control': 'no-store' };

function validarId(id) {
  return typeof id === 'string' && ID_VALIDO.test(id);
}

export async function GET(req) {
  const id = new URL(req.url).searchParams.get('id');
  if (!validarId(id)) return Response.json({ error: 'id inválido' }, { status: 400 });
  const almacen = conBlob() ? 'blob' : 'volatil';
  if (!conBlob()) {
    const sobre = volatil.get(id);
    return sobre ? Response.json({ sobre, almacen }, { headers: sinCache }) : Response.json({ error: 'sin memoria', almacen }, { status: 404, headers: sinCache });
  }
  const r = await get(ruta(id), { access: 'private', useCache: false });
  if (!r || r.statusCode === 404) return Response.json({ error: 'sin memoria', almacen }, { status: 404, headers: sinCache });
  return Response.json({ sobre: JSON.parse(await new Response(r.stream).text()), almacen }, { headers: sinCache });
}

export async function PUT(req) {
  const texto = await req.text();
  if (texto.length > MAX_BYTES) return Response.json({ error: 'memoria demasiado grande' }, { status: 413 });
  let cuerpo;
  try { cuerpo = JSON.parse(texto); } catch { return Response.json({ error: 'cuerpo inválido' }, { status: 400 }); }
  const { id, sobre } = cuerpo ?? {};
  if (!validarId(id) || sobre?.v !== 1 || typeof sobre.iv !== 'string' || typeof sobre.ct !== 'string') {
    return Response.json({ error: 'datos inválidos' }, { status: 400 });
  }
  const almacen = conBlob() ? 'blob' : 'volatil';
  if (conBlob()) {
    await put(ruta(id), JSON.stringify(sobre), { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json' });
  } else {
    volatil.set(id, sobre);
  }
  return Response.json({ ok: true, bytes: sobre.ct.length, almacen }, { headers: sinCache });
}

export async function DELETE(req) {
  const id = new URL(req.url).searchParams.get('id');
  if (!validarId(id)) return Response.json({ error: 'id inválido' }, { status: 400 });
  if (conBlob()) await del(ruta(id)).catch(() => {});
  else volatil.delete(id);
  return Response.json({ ok: true }, { headers: sinCache });
}
