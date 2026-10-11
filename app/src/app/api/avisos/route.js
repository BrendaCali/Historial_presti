import crypto from 'node:crypto';

// Avisos recibidos por webhook de Alchemy. En memoria: sirve para la demo en local o en un
// servidor único; en Vercel (serverless) habría que moverlo a una base de datos.
const avisos = (globalThis.__avisos ??= []);

function firmaValida(cuerpoCrudo, firma) {
  const clave = process.env.ALCHEMY_WEBHOOK_SIGNING_KEY;
  if (!clave || !firma) return false;
  const esperada = crypto.createHmac('sha256', clave).update(cuerpoCrudo, 'utf8').digest('hex');
  const a = Buffer.from(esperada);
  const b = Buffer.from(firma);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Alchemy llama aquí cuando hay actividad en una dirección suscrita.
export async function POST(req) {
  const cuerpo = await req.text(); // el HMAC se calcula sobre el cuerpo tal cual llegó
  if (!firmaValida(cuerpo, req.headers.get('x-alchemy-signature'))) {
    return Response.json({ error: 'firma invalida' }, { status: 401 });
  }
  const evento = JSON.parse(cuerpo);
  for (const a of evento.event?.activity ?? []) {
    avisos.unshift({
      id: `${evento.id}:${a.hash}`,
      hash: a.hash,
      de: a.fromAddress?.toLowerCase(),
      a: a.toAddress?.toLowerCase(),
      valor: a.value ?? 0,
      activo: a.asset ?? 'MON',
      recibido: new Date().toISOString(),
    });
  }
  avisos.length = Math.min(avisos.length, 50);
  return Response.json({ ok: true });
}

// La app consulta los avisos de la cuenta que está usando.
export async function GET(req) {
  const dir = new URL(req.url).searchParams.get('direccion')?.toLowerCase();
  const propios = dir ? avisos.filter((a) => a.de === dir || a.a === dir) : [];
  return Response.json({ avisos: propios.slice(0, 5) });
}
