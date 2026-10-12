import crypto from 'node:crypto';
import { leer, transaccion } from '../../../lib/mercado/almacen';

// Receptor del webhook "Address Activity" de Alchemy: avisa cuando una cuenta suscrita recibe o envía tokens.
// Cada aviso se guarda en el mismo almacén del mercado (Vercel Blob, con control de concurrencia), así sobrevive entre
// invocaciones del servidor y se puede mostrar en Actividad. Solo se aceptan avisos con firma válida (HMAC-SHA256).

const MAX_POR_CUENTA = 20;
const MAX_CUENTAS = 300;

function firmaValida(cuerpoCrudo, firma) {
  const clave = process.env.ALCHEMY_WEBHOOK_SIGNING_KEY;
  if (!clave || !firma) return false;
  const esperada = crypto.createHmac('sha256', clave).update(cuerpoCrudo, 'utf8').digest('hex');
  const a = Buffer.from(esperada);
  const b = Buffer.from(firma);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req) {
  const cuerpo = await req.text(); // el HMAC se calcula sobre el cuerpo tal cual llegó
  if (!firmaValida(cuerpo, req.headers.get('x-alchemy-signature'))) {
    return Response.json({ error: 'firma invalida' }, { status: 401 });
  }
  let evento;
  try { evento = JSON.parse(cuerpo); } catch { return Response.json({ error: 'cuerpo invalido' }, { status: 400 }); }

  const actividad = (evento.event?.activity ?? []).map((a) => ({
    id: `${a.hash}:${a.log?.logIndex ?? a.fromAddress}:${a.toAddress}`,
    hash: a.hash,
    de: a.fromAddress?.toLowerCase(),
    a: a.toAddress?.toLowerCase(),
    valor: a.value ?? 0,
    activo: a.asset ?? 'MON',
    t: Date.now(),
  })).filter((x) => x.hash && (x.de || x.a));

  if (actividad.length) {
    await transaccion((e) => {
      e.avisos ??= {};
      for (const av of actividad) {
        for (const dueño of new Set([av.de, av.a].filter(Boolean))) {
          const lista = (e.avisos[dueño] ??= []);
          if (lista.some((x) => x.id === av.id)) continue; // Alchemy puede reintentar el mismo aviso
          lista.unshift(av);
          e.avisos[dueño] = lista.slice(0, MAX_POR_CUENTA);
        }
      }
      const cuentas = Object.keys(e.avisos);
      if (cuentas.length > MAX_CUENTAS) for (const k of cuentas.slice(0, cuentas.length - MAX_CUENTAS)) delete e.avisos[k];
    });
  }
  return Response.json({ ok: true, recibidos: actividad.length });
}

// La app consulta los avisos de la cuenta que está usando (es información pública de la cadena).
export async function GET(req) {
  const dir = new URL(req.url).searchParams.get('direccion')?.toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(dir ?? '')) return Response.json({ avisos: [] }, { status: 400 });
  const { estado } = await leer();
  return Response.json({ avisos: (estado.avisos?.[dir] ?? []).slice(0, 8), configurado: Boolean(process.env.ALCHEMY_WEBHOOK_SIGNING_KEY) }, { headers: { 'cache-control': 'no-store' } });
}
