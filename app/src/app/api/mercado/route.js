import { leer, transaccion } from '../../../lib/mercado/almacen';
import { verificarPeticion, verificarQR } from '../../../lib/mercado/auth';
import * as L from '../../../lib/mercado/logica';

// API del mercado de préstamos de Preste. Todo va firmado con la cuenta del usuario (Mera). El estado vive en Vercel Blob.
//   POST  { accion, addr, ts, nonce, cuerpo, firma }  ->  lecturas privadas y todas las acciones que cambian dinero o tratos
//   GET   ?vista=reputacion&addr=0x...                 ->  reputación pública de una cuenta

const sinCache = { 'cache-control': 'no-store' };
const responder = (datos, status = 200) => Response.json(datos, { status, headers: sinCache });

const LECTURAS = {
  'ver-publicaciones': (e, q, d) => L.vistaPublicaciones(e, { viendo: q, tipo: d.tipo }),
  'ver-publicacion': (e, q, d) => L.vistaPublicacion(e, d.id, q),
  'ver-tratos': (e, q) => L.vistaTratos(e, q),
  'ver-cuenta': (e, q) => L.vistaCuenta(e, q),
  'ver-reputacion': (e, q, d) => L.reputacion(e, d.addr ?? q),
};

const ESCRITURAS = new Set(Object.keys(L.ACCIONES));

function estadoHttp(e) {
  if (e instanceof L.ErrorMercado) {
    if (['Firma', 'Reloj'].includes(e.codigo)) return 401;
    if (e.codigo === 'NoAutorizado') return 403;
    if (e.codigo === 'NoExiste') return 404;
    if (['Estado', 'Duplicado', 'Ocupado', 'CodigoUsado'].includes(e.codigo)) return 409;
    return 400;
  }
  return 500;
}

export async function POST(req) {
  try {
    let peticion;
    try { peticion = await req.json(); } catch { return responder({ error: 'Cuerpo inválido', codigo: 'Invalido' }, 400); }
    const { accion, quien, datos, nonce } = await verificarPeticion(peticion);

    if (LECTURAS[accion]) {
      const { estado } = await leer();
      return responder({ ok: true, datos: LECTURAS[accion](estado, quien, datos) });
    }
    if (!ESCRITURAS.has(accion)) throw new L.ErrorMercado('Invalido', 'Acción desconocida.');

    const entrada = { ...datos };
    if (accion === 'calificar') entrada.codigo = await verificarQR(datos.codigo);

    const resultado = await transaccion((e) => {
      const ahora = Date.now();
      // Cada petición firmada vale una sola vez: se guarda su nonce para que nadie pueda repetirla.
      if (e.usados[`r:${nonce}`]) throw new L.ErrorMercado('Duplicado', 'Esta petición ya se procesó.');
      const r = L.ACCIONES[accion](e, quien, entrada, ahora);
      e.usados[`r:${nonce}`] = ahora;
      for (const [k, t] of Object.entries(e.usados)) if (ahora - t > 10 * 60_000) delete e.usados[k];
      return r;
    });
    return responder({ ok: true, datos: resultado });
  } catch (e) {
    if (!(e instanceof L.ErrorMercado)) console.error('mercado:', e?.message);
    return responder({ ok: false, codigo: e.codigo ?? 'Error', error: e instanceof L.ErrorMercado ? e.message : 'Error del servidor. Inténtalo de nuevo.' }, estadoHttp(e));
  }
}

export async function GET(req) {
  const u = new URL(req.url);
  if (u.searchParams.get('vista') !== 'reputacion') return responder({ error: 'Vista desconocida' }, 400);
  const addr = u.searchParams.get('addr');
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr ?? '')) return responder({ error: 'Dirección inválida' }, 400);
  const { estado } = await leer();
  return responder({ ok: true, datos: L.reputacion(estado, addr) });
}
