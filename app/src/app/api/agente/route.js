import { createAval, createRelayerClient, AvalError } from '../../../vendor/aval-sdk/index.js';
import { RELAYER_URL, publicClient, usd } from '../../../lib/aval/config';
import { leer, transaccion } from '../../../lib/mercado/almacen';
import { verificarPeticion } from '../../../lib/mercado/auth';
import * as L from '../../../lib/mercado/logica';

// Asistente de Preste. Qwen PLANIFICA y USA HERRAMIENTAS en varios pasos.
//  - Mercado (siempre): busca ofertas y solicitudes con un presupuesto y una moneda, resume la cuenta y puede mostrar interés.
//    NO pide ningún permiso de gasto: consultar precios no mueve dinero.
//  - Pagos autorizados (opcional, Aval): solo si el usuario activa su permiso, puede pagar dentro de los límites que fijó;
//    lo grande espera su huella. Es una función separada.
// La clave de Qwen vive solo aquí, en el servidor. Cada petición va firmada con la cuenta del usuario.

const relayer = createRelayerClient({ url: RELAYER_URL });
const lector = createAval({ publicClient });
const MAX_PASOS = 6;

const SISTEMA_BASE = `Eres el asistente de Preste, una app de préstamos entre personas en Bolivia. Ayudas a encontrar ofertas de préstamo (alguien presta) y solicitudes (alguien necesita), a entender sus condiciones y a saber qué le toca hacer al usuario.
El dinero de la app son bolivianos de prueba (Bs). Si el usuario habla en dólares (USD), conviertes a Bs con 6.96 Bs por USD; la herramienta buscar_ofertas ya lo hace si le pasas la moneda.
Reglas:
1. Para buscar o comparar préstamos usa buscar_ofertas con el presupuesto y la moneda que dijo el usuario. Consultar ofertas NO requiere ningún permiso de gasto ni de pago.
2. Presenta pocas opciones, ordenadas de menor a mayor tasa, con monto, plazo, cuotas, tasa mensual y total a devolver. Menciona el id de cada una (por ejemplo P3) para que el usuario la abra.
3. Si no hay resultados, dilo claro y sugiere ampliar el presupuesto o el plazo, o publicar su propia solicitud en el Tablón.
4. Usa mi_resumen cuando pregunte por su saldo, sus tratos o qué debe hacer.
5. Usa me_interesa solo si el usuario te lo pide de forma explícita para una publicación concreta. Tú no registras nada: la herramienta deja la acción lista y el usuario la confirma con su huella en la app; díselo así.
6. Nunca inventes ofertas ni cifras: cuenta solo lo que devolvieron las herramientas. Responde en español, corto y claro.`;

const SISTEMA_PAGOS = `
Pagos autorizados (Aval): además tienes un permiso con límites que el usuario activó. Antes de pagar consulta consultar_permiso. Si el monto supera lo que queda o el máximo por pago, NO lo intentes y explícalo. Si supera el umbral de aprobación, usa pedir_aprobacion (queda pendiente hasta que el usuario lo apruebe con su huella en "Aprobar pagos"); si no, usa pagar. Los pagos de Aval son en tUSD y son una función distinta de los préstamos de Bs.`;

const fn = (name, description, properties = {}, required = []) => ({ type: 'function', function: { name, description, parameters: { type: 'object', properties, required } } });

const HERRAMIENTAS_MERCADO = [
  fn('buscar_ofertas', 'Busca publicaciones abiertas (ofertas y solicitudes de préstamo) que cuadren con un presupuesto y una moneda. No requiere permisos.', {
    presupuesto: { type: 'number', description: 'Monto máximo que le sirve al usuario, en la moneda indicada.' },
    moneda: { type: 'string', enum: ['BOB', 'USD'], description: 'BOB = bolivianos (por defecto), USD = dólares.' },
    tipo: { type: 'string', enum: ['oferta', 'solicitud'], description: 'oferta = alguien presta; solicitud = alguien necesita préstamo.' },
    plazo_max_dias: { type: 'number', description: 'Plazo máximo en días.' },
    tasa_max_mensual: { type: 'number', description: 'Tasa mensual máxima en %.' },
  }),
  fn('mi_resumen', 'Resume la cuenta del usuario: saldo en Bs, tratos que requieren su atención y publicaciones abiertas.'),
  fn('me_interesa', 'Prepara el interés del usuario en una publicación (solo si lo pidió de forma explícita). El usuario lo confirma con su huella.', { id: { type: 'string', description: 'Id de la publicación, por ejemplo P3.' } }, ['id']),
];

const HERRAMIENTAS_PAGOS = [
  fn('consultar_permiso', 'Lee de la cadena los límites del permiso de pagos del usuario y cuánto queda.'),
  fn('pagar', 'Paga al servicio dentro del permiso, en tUSD. Solo para montos que no superan el umbral de aprobación.', {
    monto_tusd: { type: 'number', description: 'Monto en tUSD.' }, concepto: { type: 'string', description: 'Concepto corto, hasta 31 caracteres.' },
  }, ['monto_tusd', 'concepto']),
  fn('pedir_aprobacion', 'Pide al usuario aprobar con su huella un pago que supera el umbral de aprobación.', {
    monto_tusd: { type: 'number', description: 'Monto en tUSD.' }, concepto: { type: 'string', description: 'Concepto corto, hasta 31 caracteres.' },
  }, ['monto_tusd', 'concepto']),
];

// ------------------------------------------------------------------------------------------------ pagos de Aval
const aUnidades = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x) || x <= 0 || x > 1_000_000) throw new Error('Monto inválido');
  return BigInt(Math.round(x * 1_000_000));
};
const dinero = (v) => (typeof v === 'bigint' ? `${usd(v)} tUSD` : String(v));
function explicarBloqueo(e) {
  const [a, b] = e.args ?? [];
  switch (e.code) {
    case 'ExceedsPerSpendLimit': return `El pago de ${dinero(a)} supera el máximo por pago (${dinero(b)}).`;
    case 'ExceedsTotalLimit': return `El pago de ${dinero(a)} supera lo que queda del permiso (${dinero(b)}).`;
    case 'NeedsApproval': return `El pago de ${dinero(a)} supera el umbral de ${dinero(b)}: hay que pedir aprobación.`;
    case 'RecipientNotAllowed': return 'Ese destinatario no está en la lista del permiso.';
    case 'PermitInactive': return 'El permiso está revocado, vencido o ya se gastó.';
    default: return e.message;
  }
}
const BLOQUEOS = new Set(['ExceedsPerSpendLimit', 'ExceedsTotalLimit', 'NeedsApproval', 'RecipientNotAllowed', 'PermitInactive']);

async function ejecutarPagos(nombre, entrada, permitId) {
  try {
    if (nombre === 'consultar_permiso') {
      const [permiso, queda] = await Promise.all([lector.permits.get(permitId), lector.permits.remaining(permitId)]);
      const t = permiso.terms;
      const nunca = t.approvalThreshold >= (1n << 128n) - 1n;
      return {
        activo: !permiso.revoked && queda > 0n, maximo_por_pago_tusd: usd(t.maxPerSpend), total_tusd: usd(t.maxTotal), gastado_tusd: usd(permiso.spent),
        queda_tusd: usd(queda), umbral_aprobacion_tusd: nunca ? 'sin umbral' : usd(t.approvalThreshold), vence: new Date(Number(t.expiresAt) * 1000).toISOString(),
      };
    }
    if (nombre === 'pagar') {
      const r = await relayer.agent.spend({ permitId, amount: aUnidades(entrada.monto_tusd), ref: String(entrada.concepto ?? '').slice(0, 31) });
      return { ok: true, pagado_tusd: entrada.monto_tusd, tx: r.hash };
    }
    if (nombre === 'pedir_aprobacion') {
      const r = await relayer.agent.request({ permitId, amount: aUnidades(entrada.monto_tusd), ref: String(entrada.concepto ?? '').slice(0, 31) });
      return { ok: true, pendiente: true, id_pedido: String(r.requestId), monto_tusd: entrada.monto_tusd, nota: 'El usuario debe aprobarlo con su huella en "Aprobar pagos".' };
    }
    return { ok: false, mensaje: `Herramienta desconocida: ${nombre}` };
  } catch (e) {
    if (e instanceof AvalError && BLOQUEOS.has(e.code)) return { ok: false, bloqueado_por_el_contrato: true, codigo: e.code, mensaje: explicarBloqueo(e) };
    return { ok: false, mensaje: e instanceof Error ? e.message : 'Error desconocido' };
  }
}

// ------------------------------------------------------------------------------------------------ mercado
async function ejecutarMercado(nombre, entrada, quien) {
  try {
    if (nombre === 'buscar_ofertas') {
      const { estado } = await leer();
      const r = L.buscar(estado, {
        presupuesto: entrada.presupuesto, moneda: entrada.moneda, tipo: entrada.tipo,
        plazoMaxDias: entrada.plazo_max_dias, tasaMaxMensual: entrada.tasa_max_mensual, viendo: quien,
      });
      return { cantidad: r.length, tipo_cambio_bob_por_usd: L.REGLAS.TIPO_CAMBIO_BOB_POR_USD, ofertas: r };
    }
    if (nombre === 'mi_resumen') {
      const { estado } = await leer();
      const yo = L.norm(quien);
      const cuenta = L.vistaCuenta(estado, yo);
      const tratos = L.vistaTratos(estado, yo);
      const pendientes = tratos.filter((t) => (t.estado === 'propuesto' && !t.acepta[yo]) || (t.estado === 'aceptado' && t.miRol === 'prestamista') || (t.estado === 'activo' && t.miRol === 'prestatario'));
      return {
        saldo_bs: L.enBs(cuenta.saldo),
        tratos_activos: tratos.filter((t) => t.estado === 'activo').length,
        te_toca: pendientes.map((t) => ({ trato: t.id, que: t.estado === 'propuesto' ? 'aceptar' : t.estado === 'aceptado' ? 'desembolsar' : `abonar (debes Bs ${L.enBs(t.total - t.pagado)})` })),
        publicaciones_abiertas: L.vistaPublicaciones(estado, { viendo: yo }).filter((p) => p.soyAutor).length,
        reputacion: L.reputacion(estado, yo).nivel,
      };
    }
    if (nombre === 'me_interesa') {
      // El asistente no se compromete por el usuario: valida la publicación y deja la confirmación a su huella en la app.
      const { estado } = await leer();
      const id = String(entrada.id).toUpperCase();
      const p = L.vistaPublicaciones(estado, { viendo: quien }).find((x) => x.id === id);
      if (!p) return { ok: false, mensaje: `No encuentro la publicación ${id}.` };
      return { ok: true, requiere_huella: true, id, nota: 'Falta que el usuario confirme con su huella en la app; hasta entonces no se registra nada.' };
    }
    return { ok: false, mensaje: `Herramienta desconocida: ${nombre}` };
  } catch (e) {
    return { ok: false, mensaje: e instanceof L.ErrorMercado ? e.message : 'Error al consultar el mercado.' };
  }
}

const ejecutar = (nombre, entrada, ctx) => (['consultar_permiso', 'pagar', 'pedir_aprobacion'].includes(nombre)
  ? (ctx.permitId ? ejecutarPagos(nombre, entrada, ctx.permitId) : { ok: false, mensaje: 'Los pagos autorizados no están activados.' })
  : ejecutarMercado(nombre, entrada, ctx.quien));

// ------------------------------------------------------------------------------------------------ Qwen
async function llamarQwen(mensajes, herramientas) {
  const base = process.env.DASHSCOPE_BASE_URL ?? 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
  const r = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}` },
    body: JSON.stringify({ model: process.env.QWEN_MODEL, messages: mensajes, tools: herramientas, temperature: 0.2 }),
  });
  if (!r.ok) throw new Error(`Qwen respondió ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return (await r.json()).choices[0].message;
}

async function conQwen(historial, ctx) {
  const herramientas = ctx.permitId ? [...HERRAMIENTAS_MERCADO, ...HERRAMIENTAS_PAGOS] : HERRAMIENTAS_MERCADO;
  const mensajes = [{ role: 'system', content: SISTEMA_BASE + (ctx.permitId ? SISTEMA_PAGOS : '') }, ...historial];
  const pasos = [];
  for (let i = 0; i < MAX_PASOS; i++) {
    const m = await llamarQwen(mensajes, herramientas);
    if (!m.tool_calls?.length) return { respuesta: m.content ?? '', pasos };
    mensajes.push(m);
    for (const llamada of m.tool_calls) {
      let entrada = {};
      try { entrada = JSON.parse(llamada.function.arguments || '{}'); } catch { /* argumentos vacíos */ }
      const resultado = await ejecutar(llamada.function.name, entrada, ctx);
      pasos.push({ herramienta: llamada.function.name, entrada, resultado });
      mensajes.push({ role: 'tool', tool_call_id: llamada.id, content: JSON.stringify(resultado) });
    }
  }
  return { respuesta: 'Hice varios pasos pero no logré terminar. Dime cómo seguimos.', pasos };
}

// Modo SIMULADO (solo desarrollo, AGENTE_SIMULADO=1): un planificador de reglas con las mismas herramientas. NO es Qwen.
async function simulado(historial, ctx) {
  const texto = historial.filter((m) => m.role === 'user').at(-1)?.content ?? '';
  const pasos = [];
  const paso = async (herramienta, entrada = {}) => {
    const resultado = await ejecutar(herramienta, entrada, ctx);
    pasos.push({ herramienta, entrada, resultado });
    return resultado;
  };
  const t = texto.toLowerCase();
  const num = t.match(/(\d+(?:[.,]\d+)?)/);
  const monto = num ? Number(num[1].replace(',', '.')) : undefined;
  const usdMoneda = /(usd|d[oó]lar|dolar|\$)/.test(t);

  if (/(saldo|resumen|mis tratos|qu[eé] me toca|c[oó]mo voy)/.test(t)) {
    const r = await paso('mi_resumen');
    const falta = r.te_toca?.length ? ` Te toca: ${r.te_toca.map((x) => `${x.que} (trato ${x.trato})`).join(', ')}.` : ' No tienes nada pendiente.';
    return { respuesta: `Tu saldo es Bs ${r.saldo_bs}, con ${r.tratos_activos} trato(s) activo(s).${falta}`, pasos };
  }
  if (ctx.permitId && /(paga|pagar|abona)/.test(t) && monto) {
    const permiso = await paso('consultar_permiso');
    if (!permiso.activo) return { respuesta: 'Tu permiso de pagos no está activo.', pasos };
    const umbral = permiso.umbral_aprobacion_tusd === 'sin umbral' ? Infinity : Number(permiso.umbral_aprobacion_tusd);
    if (monto > Number(permiso.maximo_por_pago_tusd)) return { respuesta: `No intento pagar ${monto} tUSD: supera tu máximo por pago (${permiso.maximo_por_pago_tusd}).`, pasos };
    const concepto = (t.match(/(?:de|por|para)\s+([\p{L}\s]{2,24})/iu)?.[1] ?? 'pago').trim();
    const r = await paso(monto > umbral ? 'pedir_aprobacion' : 'pagar', { monto_tusd: monto, concepto });
    return { respuesta: r.ok ? (monto > umbral ? `Pedí tu aprobación para ${monto} tUSD. Apruébala con tu huella en "Aprobar pagos".` : `Pagué ${monto} tUSD (${concepto}).`) : `No pude: ${r.mensaje}`, pasos };
  }
  const interes = t.match(/me interesa\s+(?:la\s+|el\s+)?(p\d+)/);
  if (interes) {
    const r = await paso('me_interesa', { id: interes[1].toUpperCase() });
    return { respuesta: r.ok ? `Preparé tu interés en ${interes[1].toUpperCase()}. Confírmalo con tu huella para que quede registrado.` : `No pude: ${r.mensaje}`, pasos };
  }
  const entrada = {
    ...(monto !== undefined ? { presupuesto: monto, moneda: usdMoneda ? 'USD' : 'BOB' } : {}),
    ...(/solicitud|necesitan|piden/.test(t) ? { tipo: 'solicitud' } : /oferta|prestan|ofrecen|pr[eé]stamo|prestar/.test(t) ? { tipo: 'oferta' } : {}),
  };
  const r = await paso('buscar_ofertas', entrada);
  if (!r.cantidad) return { respuesta: 'No encontré publicaciones con ese presupuesto. Prueba con un monto mayor o publica tu propia solicitud en el Tablón.', pasos };
  const resumen = r.ofertas.slice(0, 3).map((o) => `${o.id}: Bs ${o.monto_bs} (≈ US$ ${o.monto_usd}) a ${o.plazo_dias} días, ${o.tasa_mensual_pct}%/mes, devuelves Bs ${o.total_a_devolver_bs}`).join('; ');
  return { respuesta: `Encontré ${r.cantidad} publicación(es)${monto !== undefined ? ` hasta ${monto} ${usdMoneda ? 'USD' : 'Bs'}` : ''}. ${resumen}.`, pasos };
}

export async function POST(req) {
  try {
    let peticion;
    try { peticion = await req.json(); } catch { return Response.json({ error: 'Cuerpo inválido' }, { status: 400 }); }
    const { quien, datos } = await verificarPeticion(peticion);
    const { mensajes, permitId } = datos ?? {};
    if (!Array.isArray(mensajes) || mensajes.length === 0 || mensajes.length > 30) return Response.json({ error: 'Mensajes inválidos' }, { status: 400 });
    if (permitId != null && !/^\d{1,18}$/.test(String(permitId))) return Response.json({ error: 'Permiso inválido' }, { status: 400 });

    const historial = mensajes
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
    const ctx = { quien, permitId: permitId != null ? BigInt(permitId) : null };

    if (process.env.DASHSCOPE_API_KEY && process.env.QWEN_MODEL) return Response.json({ ...(await conQwen(historial, ctx)), modelo: process.env.QWEN_MODEL });
    if (process.env.AGENTE_SIMULADO === '1') return Response.json({ ...(await simulado(historial, ctx)), modelo: 'simulado' });
    return Response.json({ error: 'Falta configurar Qwen: define DASHSCOPE_API_KEY y QWEN_MODEL en .env.local.' }, { status: 503 });
  } catch (e) {
    const firma = e instanceof L.ErrorMercado;
    return Response.json({ error: firma ? e.message : (e instanceof Error ? e.message : 'Error del asistente') }, { status: firma ? 401 : 502 });
  }
}
