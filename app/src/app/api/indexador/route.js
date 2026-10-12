// Puente al indexador de Aval (Envio HyperIndex, GraphQL). La URL vive solo en el servidor (INDEXER_URL): el navegador
// habla con nosotros, así no hay problemas de CORS y no se expone el origen. Solo deja pasar consultas de lectura.

const MAX_CONSULTA = 4_000;

export async function POST(req) {
  const url = process.env.INDEXER_URL;
  if (!url) return Response.json({ errors: [{ message: 'El indexador no está configurado (INDEXER_URL).' }] }, { status: 503 });

  let cuerpo;
  try { cuerpo = await req.json(); } catch { return Response.json({ errors: [{ message: 'Cuerpo inválido.' }] }, { status: 400 }); }
  const q = cuerpo?.query;
  if (typeof q !== 'string' || q.length > MAX_CONSULTA || /\b(mutation|subscription)\b/i.test(q)) {
    return Response.json({ errors: [{ message: 'Solo se aceptan consultas de lectura.' }] }, { status: 400 });
  }

  try {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: q }), cache: 'no-store' });
    return new Response(await r.text(), { status: r.status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  } catch {
    return Response.json({ errors: [{ message: 'No se pudo llegar al indexador.' }] }, { status: 502 });
  }
}
