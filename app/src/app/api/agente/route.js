import { createAval, createRelayerClient, AvalError } from '../../../vendor/aval-sdk/index.js';
import { RELAYER_URL, publicClient, usd } from '../../../lib/aval/config';

// Asistente de pagos de Preste. Qwen PLANIFICA y USA HERRAMIENTAS en varios pasos; las herramientas ejecutan los
// pagos con el SDK de Aval (relayer.agent.*) y el contrato aplica los límites del permiso del usuario.
// La clave de Qwen vive solo aquí, en el servidor (nunca en el navegador).

const relayer = createRelayerClient({ url: RELAYER_URL });
const lector = createAval({ publicClient });
const MAX_PASOS = 6;

const SISTEMA = `Eres el asistente de pagos de Preste, construido sobre Aval en Monad testnet. Pagas en nombre del usuario, en tUSD (dinero de prueba), SOLO al servicio que tienes configurado y SOLO dentro del permiso con límites que el usuario te dio.
Reglas:
1. Antes de pagar o pedir aprobación, llama siempre a consultar_permiso para conocer el máximo por pago, lo que queda y el umbral de aprobación.
2. Si el monto supera lo que queda del permiso o el máximo por pago, NO lo intentes: explica por qué no se puede y propón una alternativa (pagar menos o que el usuario cree otro permiso).
3. Si el monto es mayor que el umbral de aprobación (y no supera el máximo por pago), usa pedir_aprobacion: el pago queda pendiente hasta que el usuario lo apruebe con su huella en la pestaña "Aprobar".
4. Si el monto es menor o igual al umbral, usa pagar.
5. Puedes hacer varios pagos en una misma petición, uno por uno, y debes revisar lo que queda del permiso entre uno y otro.
6. Solo reseña al servicio (resenar_servicio, de 0 a 100) si el usuario lo pide.
7. Nunca inventes resultados: cuenta solo lo que devolvieron las herramientas. Responde en español, corto y claro, con montos en tUSD.`;

const HERRAMIENTAS = [
  {
    type: 'function',
    function: {
      name: 'consultar_permiso',
      description: 'Lee de la cadena los límites del permiso del usuario y cuánto queda por gastar.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'pagar',
      description: 'Paga al servicio dentro del permiso. Solo para montos que no superan el umbral de aprobación.',
      parameters: {
        type: 'object',
        properties: {
          monto_tusd: { type: 'number', description: 'Monto en tUSD (por ejemplo 12.5).' },
          concepto: { type: 'string', description: 'Concepto corto del pago, de hasta 31 caracteres (por ejemplo "luz").' },
        },
        required: ['monto_tusd', 'concepto'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'pedir_aprobacion',
      description: 'Pide al usuario aprobar con su huella un pago que supera el umbral de aprobación. Queda pendiente.',
      parameters: {
        type: 'object',
        properties: {
          monto_tusd: { type: 'number', description: 'Monto en tUSD.' },
          concepto: { type: 'string', description: 'Concepto corto, de hasta 31 caracteres.' },
        },
        required: ['monto_tusd', 'concepto'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resenar_servicio',
      description: 'Deja una reseña del servicio de 0 a 100. Solo cuenta en la reputación verificada si ya le pagaste.',
      parameters: { type: 'object', properties: { puntaje: { type: 'number', description: 'De 0 a 100.' } }, required: ['puntaje'] },
    },
  },
];

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

async function ejecutar(nombre, entrada, permitId) {
  try {
    if (nombre === 'consultar_permiso') {
      const [permiso, queda] = await Promise.all([lector.permits.get(permitId), lector.permits.remaining(permitId)]);
      const t = permiso.terms;
      const nunca = t.approvalThreshold >= (1n << 128n) - 1n;
      return {
        activo: !permiso.revoked && queda > 0n,
        maximo_por_pago_tusd: usd(t.maxPerSpend),
        total_tusd: usd(t.maxTotal),
        gastado_tusd: usd(permiso.spent),
        queda_tusd: usd(queda),
        umbral_aprobacion_tusd: nunca ? 'sin umbral' : usd(t.approvalThreshold),
        vence: new Date(Number(t.expiresAt) * 1000).toISOString(),
      };
    }
    if (nombre === 'pagar') {
      const r = await relayer.agent.spend({ permitId, amount: aUnidades(entrada.monto_tusd), ref: String(entrada.concepto ?? '').slice(0, 31) });
      return { ok: true, pagado_tusd: entrada.monto_tusd, tx: r.hash };
    }
    if (nombre === 'pedir_aprobacion') {
      const r = await relayer.agent.request({ permitId, amount: aUnidades(entrada.monto_tusd), ref: String(entrada.concepto ?? '').slice(0, 31) });
      return { ok: true, pendiente: true, id_pedido: String(r.requestId), monto_tusd: entrada.monto_tusd, nota: 'El usuario debe aprobarlo con su huella en la pestaña Aprobar.' };
    }
    if (nombre === 'resenar_servicio') {
      const valor = Math.max(0, Math.min(100, Math.round(Number(entrada.puntaje))));
      const r = await relayer.agent.review({ value: valor, tag: 'calidad' });
      return { ok: true, puntaje: valor, tx: r.hash };
    }
    return { ok: false, mensaje: `Herramienta desconocida: ${nombre}` };
  } catch (e) {
    if (e instanceof AvalError && BLOQUEOS.has(e.code)) return { ok: false, bloqueado_por_el_contrato: true, codigo: e.code, mensaje: explicarBloqueo(e) };
    return { ok: false, mensaje: e instanceof Error ? e.message : 'Error desconocido' };
  }
}

// ----------------------------------------------------------------------------------------------- Qwen

async function llamarQwen(mensajes) {
  const base = process.env.DASHSCOPE_BASE_URL ?? 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
  const r = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}` },
    body: JSON.stringify({ model: process.env.QWEN_MODEL, messages: mensajes, tools: HERRAMIENTAS, temperature: 0.2 }),
  });
  if (!r.ok) throw new Error(`Qwen respondió ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return (await r.json()).choices[0].message;
}

async function conQwen(historial, permitId) {
  const mensajes = [{ role: 'system', content: SISTEMA }, ...historial];
  const pasos = [];
  for (let i = 0; i < MAX_PASOS; i++) {
    const m = await llamarQwen(mensajes);
    if (!m.tool_calls?.length) return { respuesta: m.content ?? '', pasos };
    mensajes.push(m);
    for (const llamada of m.tool_calls) {
      let entrada = {};
      try { entrada = JSON.parse(llamada.function.arguments || '{}'); } catch { /* argumentos vacíos */ }
      const resultado = await ejecutar(llamada.function.name, entrada, permitId);
      pasos.push({ herramienta: llamada.function.name, entrada, resultado });
      mensajes.push({ role: 'tool', tool_call_id: llamada.id, content: JSON.stringify(resultado) });
    }
  }
  return { respuesta: 'Hice varios pasos pero no logré terminar. Revisa la actividad y dime cómo seguimos.', pasos };
}

// Modo SIMULADO (solo desarrollo, activado con AGENTE_SIMULADO=1): un planificador de reglas que usa las mismas
// herramientas. NO es Qwen y la interfaz lo rotula así. Sirve para probar el flujo sin la clave de Alibaba Cloud.
async function simulado(historial, permitId) {
  const texto = historial.filter((m) => m.role === 'user').at(-1)?.content ?? '';
  const pasos = [];
  const paso = async (herramienta, entrada = {}) => {
    const resultado = await ejecutar(herramienta, entrada, permitId);
    pasos.push({ herramienta, entrada, resultado });
    return resultado;
  };
  const montos = [...texto.matchAll(/(\d+(?:[.,]\d+)?)/g)].map((m) => Number(m[1].replace(',', '.')));
  if (/rese|califica/i.test(texto) && montos.length) {
    const r = await paso('resenar_servicio', { puntaje: montos[0] });
    return { respuesta: r.ok ? `Listo, reseñé al servicio con ${r.puntaje}/100.` : `No pude reseñar: ${r.mensaje}`, pasos };
  }
  if (!montos.length) return { respuesta: 'Dime cuánto y para qué pagar, por ejemplo: "paga 10 de luz".', pasos };
  const permiso = await paso('consultar_permiso');
  if (!permiso.activo) return { respuesta: 'Tu permiso no está activo. Crea uno en la pestaña Permiso.', pasos };
  const concepto = (texto.match(/(?:de|por|para)\s+([\p{L}\s]{2,24})/iu)?.[1] ?? 'pago').trim();
  const lineas = [];
  for (const monto of montos) {
    const umbral = permiso.umbral_aprobacion_tusd === 'sin umbral' ? Infinity : Number(permiso.umbral_aprobacion_tusd);
    if (monto > Number(permiso.maximo_por_pago_tusd)) lineas.push(`No intento pagar ${monto} tUSD: supera tu máximo por pago (${permiso.maximo_por_pago_tusd}).`);
    else if (monto > umbral) {
      const r = await paso('pedir_aprobacion', { monto_tusd: monto, concepto });
      lineas.push(r.ok ? `Pedí tu aprobación para ${monto} tUSD (${concepto}). Apruébalo con tu huella en la pestaña Aprobar.` : `No pude pedir la aprobación: ${r.mensaje}`);
    } else {
      const r = await paso('pagar', { monto_tusd: monto, concepto });
      lineas.push(r.ok ? `Pagué ${monto} tUSD (${concepto}).` : `No pude pagar ${monto} tUSD: ${r.mensaje}`);
    }
  }
  return { respuesta: lineas.join(' '), pasos };
}

export async function POST(req) {
  let cuerpo;
  try { cuerpo = await req.json(); } catch { return Response.json({ error: 'Cuerpo inválido' }, { status: 400 }); }
  const { mensajes, permitId } = cuerpo ?? {};
  if (!Array.isArray(mensajes) || mensajes.length === 0 || mensajes.length > 30) return Response.json({ error: 'Mensajes inválidos' }, { status: 400 });
  if (!/^\d{1,18}$/.test(String(permitId ?? ''))) return Response.json({ error: 'Falta el permiso. Crea uno en la pestaña Permiso.' }, { status: 400 });

  const historial = mensajes
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  const id = BigInt(permitId);

  try {
    if (process.env.DASHSCOPE_API_KEY && process.env.QWEN_MODEL) {
      return Response.json({ ...(await conQwen(historial, id)), modelo: process.env.QWEN_MODEL });
    }
    if (process.env.AGENTE_SIMULADO === '1') {
      return Response.json({ ...(await simulado(historial, id)), modelo: 'simulado' });
    }
    return Response.json({ error: 'Falta configurar Qwen: define DASHSCOPE_API_KEY y QWEN_MODEL en .env.local.' }, { status: 503 });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error del asistente' }, { status: 502 });
  }
}

