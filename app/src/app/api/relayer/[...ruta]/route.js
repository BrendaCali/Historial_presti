import { RELAYER_URL } from '../../../../lib/aval/config';

// Puente al relayer de Aval. El relayer solo acepta llamadas del navegador desde los orígenes de su lista (CORS),
// así que el navegador nos llama a nosotros y el servidor reenvía. Solo pasan las rutas que el SDK usa.
const PERMITIDAS = /^(health|faucet|relay\/(register|grant|revoke|token-permit|approve)|agent\/(info|spend|request|review))$/;

async function reenviar(req, { params }) {
  const { ruta } = await params;
  const destino = ruta.join('/');
  if (!PERMITIDAS.test(destino)) return Response.json({ error: { code: 'NotFound', message: 'Ruta no permitida.' } }, { status: 404 });

  const init = { method: req.method, headers: {} };
  if (req.method === 'POST') {
    init.headers['content-type'] = 'application/json';
    init.body = await req.text();
  }
  const ip = req.headers.get('x-forwarded-for');
  if (ip) init.headers['x-forwarded-for'] = ip;

  const r = await fetch(`${RELAYER_URL}/${destino}`, init);
  const salida = { 'content-type': r.headers.get('content-type') ?? 'application/json' };
  const retry = r.headers.get('retry-after');
  if (retry) salida['retry-after'] = retry;
  return new Response(await r.text(), { status: r.status, headers: salida });
}

export const GET = reenviar;
export const POST = reenviar;
