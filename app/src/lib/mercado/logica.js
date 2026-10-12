// Lógica del mercado de préstamos de Preste. Funciones PURAS: reciben el estado y devuelven el estado nuevo, sin
// tocar red ni disco. Así se prueban solas y el almacén (Vercel Blob) solo se ocupa de guardar el resultado.
//
// El dinero son "Bs de prueba" en una billetera propia de la app (no es dinero real ni va a la cadena). Se guarda en
// CENTAVOS enteros para no tener errores de redondeo.

export const REGLAS = {
  MIN_CENTAVOS: 50_00, // monto mínimo de un préstamo: Bs 50
  MAX_CENTAVOS: 5_000_00,
  MAX_PLAZO_DIAS: 365,
  MAX_TASA_MENSUAL: 10, // % mensual
  MAX_CUOTAS: 12,
  MAX_ABIERTAS: 5, // publicaciones abiertas por persona
  DEPOSITO_MIN: 10_00,
  DEPOSITO_MAX: 500_00,
  DEPOSITO_DIA: 1_500_00, // tope de depósitos de prueba por persona y día
  RETIRO_MIN: 10_00,
  VIDA_QR_SEG: 120, // un código QR de calificación vale 2 minutos (en pantalla cambia cada 30 s)
  TIPO_CAMBIO_BOB_POR_USD: 6.96,
};

export class ErrorMercado extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}
const fallo = (codigo, mensaje) => { throw new ErrorMercado(codigo, mensaje); };

export const estadoVacio = () => ({ v: 1, seq: 0, cuentas: {}, ofertas: {}, tratos: {}, usados: {} });
export const norm = (a) => String(a ?? '').toLowerCase();
export const aCentavos = (bs) => Math.round(Number(bs) * 100);
export const enBs = (c) => (c / 100).toFixed(2);

// ------------------------------------------------------------------------------------------------ cuentas y dinero

function cuenta(e, quien) {
  const k = norm(quien);
  return (e.cuentas[k] ??= { saldo: 0, mov: [], dep: { dia: '', total: 0 } });
}

function mover(e, de, a, monto, tipo, ref, ahora) {
  const origen = de ? cuenta(e, de) : null;
  const destino = a ? cuenta(e, a) : null;
  if (origen) {
    if (origen.saldo < monto) fallo('SaldoInsuficiente', `Tu saldo (Bs ${enBs(origen.saldo)}) no alcanza para Bs ${enBs(monto)}.`);
    origen.saldo -= monto;
    origen.mov.unshift({ t: ahora, tipo: `${tipo}-salida`, monto: -monto, ref });
  }
  if (destino) {
    destino.saldo += monto;
    destino.mov.unshift({ t: ahora, tipo: `${tipo}-entrada`, monto, ref });
  }
  for (const c of [origen, destino]) if (c) c.mov = c.mov.slice(0, 60);
}

function entero(valor, nombre) {
  const n = Number(valor);
  if (!Number.isFinite(n) || !Number.isInteger(n)) fallo('Invalido', `${nombre} inválido.`);
  return n;
}

export function depositar(e, quien, { monto }, ahora) {
  const m = entero(monto, 'El monto');
  if (m < REGLAS.DEPOSITO_MIN || m > REGLAS.DEPOSITO_MAX) {
    fallo('Invalido', `Cada depósito de prueba va de Bs ${enBs(REGLAS.DEPOSITO_MIN)} a Bs ${enBs(REGLAS.DEPOSITO_MAX)}.`);
  }
  const c = cuenta(e, quien);
  const dia = new Date(ahora).toISOString().slice(0, 10);
  if (c.dep.dia !== dia) c.dep = { dia, total: 0 };
  if (c.dep.total + m > REGLAS.DEPOSITO_DIA) {
    fallo('LimiteDiario', `Superas el tope de depósitos de prueba de hoy (Bs ${enBs(REGLAS.DEPOSITO_DIA)}). Te quedan Bs ${enBs(REGLAS.DEPOSITO_DIA - c.dep.total)}.`);
  }
  c.dep.total += m;
  mover(e, null, quien, m, 'deposito', 'Depósito de prueba', ahora);
  return { saldo: c.saldo };
}

export function retirar(e, quien, { monto }, ahora) {
  const m = entero(monto, 'El monto');
  if (m < REGLAS.RETIRO_MIN) fallo('Invalido', `El retiro mínimo es Bs ${enBs(REGLAS.RETIRO_MIN)}.`);
  mover(e, quien, null, m, 'retiro', 'Retiro de prueba', ahora);
  return { saldo: cuenta(e, quien).saldo };
}

// ------------------------------------------------------------------------------------------------ condiciones del préstamo

export function calcularCondiciones({ monto, plazoDias, tasaMensual, cuotas }) {
  const interes = Math.round((monto * (tasaMensual / 100) * plazoDias) / 30);
  const total = monto + interes;
  const cuota = Math.ceil(total / cuotas);
  return { interes, total, cuota };
}

// ------------------------------------------------------------------------------------------------ publicaciones

export function publicar(e, quien, d, ahora) {
  const tipo = d.tipo;
  if (tipo !== 'oferta' && tipo !== 'solicitud') fallo('Invalido', 'El tipo debe ser "oferta" o "solicitud".');
  const monto = entero(d.monto, 'El monto');
  const plazoDias = entero(d.plazoDias, 'El plazo');
  const cuotas = entero(d.cuotas ?? 1, 'Las cuotas');
  const tasaMensual = Number(d.tasaMensual ?? 0);
  if (monto < REGLAS.MIN_CENTAVOS || monto > REGLAS.MAX_CENTAVOS) {
    fallo('Invalido', `El monto va de Bs ${enBs(REGLAS.MIN_CENTAVOS)} a Bs ${enBs(REGLAS.MAX_CENTAVOS)}.`);
  }
  if (plazoDias < 1 || plazoDias > REGLAS.MAX_PLAZO_DIAS) fallo('Invalido', `El plazo va de 1 a ${REGLAS.MAX_PLAZO_DIAS} días.`);
  if (cuotas < 1 || cuotas > REGLAS.MAX_CUOTAS || cuotas > plazoDias) fallo('Invalido', `Las cuotas van de 1 a ${REGLAS.MAX_CUOTAS} y no pueden pasar del plazo.`);
  if (!Number.isFinite(tasaMensual) || tasaMensual < 0 || tasaMensual > REGLAS.MAX_TASA_MENSUAL) {
    fallo('Invalido', `La tasa mensual va de 0% a ${REGLAS.MAX_TASA_MENSUAL}%.`);
  }
  const abiertas = Object.values(e.ofertas).filter((o) => o.autor === norm(quien) && o.estado === 'abierta').length;
  if (abiertas >= REGLAS.MAX_ABIERTAS) fallo('LimitePublicaciones', `Ya tienes ${REGLAS.MAX_ABIERTAS} publicaciones abiertas. Cierra alguna antes de publicar otra.`);
  const id = `P${++e.seq}`;
  e.ofertas[id] = {
    id, tipo, autor: norm(quien), monto, plazoDias, cuotas, tasaMensual,
    nota: String(d.nota ?? '').slice(0, 160), estado: 'abierta', interesados: [], creada: ahora,
  };
  return { id };
}

export function cerrarPublicacion(e, quien, { id }) {
  const o = e.ofertas[id] ?? fallo('NoExiste', 'La publicación no existe.');
  if (o.autor !== norm(quien)) fallo('NoAutorizado', 'Solo quien la publicó puede cerrarla.');
  if (o.estado !== 'abierta') fallo('Estado', 'La publicación ya no está abierta.');
  o.estado = 'cerrada';
  return { ok: true };
}

export function interesar(e, quien, { id }, ahora) {
  const o = e.ofertas[id] ?? fallo('NoExiste', 'La publicación no existe.');
  if (o.estado !== 'abierta') fallo('Estado', 'La publicación ya no está abierta.');
  if (o.autor === norm(quien)) fallo('NoAutorizado', 'No puedes mostrar interés en tu propia publicación.');
  if (o.interesados.some((i) => i.addr === norm(quien))) fallo('Duplicado', 'Ya mostraste interés en esta publicación.');
  o.interesados.push({ addr: norm(quien), t: ahora });
  return { interesados: o.interesados.length };
}

export function quitarInteres(e, quien, { id }) {
  const o = e.ofertas[id] ?? fallo('NoExiste', 'La publicación no existe.');
  o.interesados = o.interesados.filter((i) => i.addr !== norm(quien));
  return { interesados: o.interesados.length };
}

// ------------------------------------------------------------------------------------------------ tratos

export function elegir(e, quien, { id, interesado }, ahora) {
  const o = e.ofertas[id] ?? fallo('NoExiste', 'La publicación no existe.');
  if (o.autor !== norm(quien)) fallo('NoAutorizado', 'Solo quien publicó puede elegir con quién hacer el trato.');
  if (o.estado !== 'abierta') fallo('Estado', 'La publicación ya no está abierta.');
  const otro = norm(interesado);
  if (!o.interesados.some((i) => i.addr === otro)) fallo('NoExiste', 'Esa persona no mostró interés en tu publicación.');
  const prestamista = o.tipo === 'oferta' ? o.autor : otro;
  const prestatario = o.tipo === 'oferta' ? otro : o.autor;
  const { interes, total, cuota } = calcularCondiciones(o);
  const tid = `T${++e.seq}`;
  e.tratos[tid] = {
    id: tid, ofertaId: o.id, prestamista, prestatario,
    monto: o.monto, plazoDias: o.plazoDias, cuotas: o.cuotas, tasaMensual: o.tasaMensual, interes, total, cuota,
    estado: 'propuesto', acepta: { [o.autor]: ahora }, pagos: [], pagado: 0, calif: {}, creado: ahora, historial: [{ t: ahora, e: 'propuesto', por: o.autor }],
  };
  o.estado = 'en-trato';
  o.tratoId = tid;
  return { tratoId: tid };
}

function trato(e, id) {
  return e.tratos[id] ?? fallo('NoExiste', 'El trato no existe.');
}
function parte(t, quien) {
  const q = norm(quien);
  if (q !== t.prestamista && q !== t.prestatario) fallo('NoAutorizado', 'No participas en este trato.');
  return q === t.prestamista ? 'prestamista' : 'prestatario';
}

export function aceptar(e, quien, { id }, ahora) {
  const t = trato(e, id);
  parte(t, quien);
  if (t.estado !== 'propuesto') fallo('Estado', 'Este trato ya no espera aceptación.');
  if (t.acepta[norm(quien)]) fallo('Duplicado', 'Ya aceptaste este trato.');
  t.acepta[norm(quien)] = ahora;
  if (t.acepta[t.prestamista] && t.acepta[t.prestatario]) {
    t.estado = 'aceptado';
    t.historial.push({ t: ahora, e: 'aceptado', por: norm(quien) });
  }
  return { estado: t.estado };
}

export function cancelar(e, quien, { id }, ahora) {
  const t = trato(e, id);
  parte(t, quien);
  if (t.estado !== 'propuesto' && t.estado !== 'aceptado') fallo('Estado', 'Un trato con dinero desembolsado ya no se puede cancelar.');
  t.estado = 'cancelado';
  t.historial.push({ t: ahora, e: 'cancelado', por: norm(quien) });
  const o = e.ofertas[t.ofertaId];
  if (o) { o.estado = 'abierta'; delete o.tratoId; }
  return { estado: t.estado };
}

export function desembolsar(e, quien, { id }, ahora) {
  const t = trato(e, id);
  if (parte(t, quien) !== 'prestamista') fallo('NoAutorizado', 'Solo quien presta puede desembolsar.');
  if (t.estado !== 'aceptado') fallo('Estado', t.estado === 'propuesto' ? 'Falta que ambas personas acepten el trato.' : 'Este trato ya no se puede desembolsar.');
  mover(e, t.prestamista, t.prestatario, t.monto, 'desembolso', `Trato ${t.id}`, ahora);
  t.estado = 'activo';
  t.desembolsado = ahora;
  t.cronograma = Array.from({ length: t.cuotas }, (_, i) => ({
    n: i + 1,
    vence: ahora + Math.round(((t.plazoDias * (i + 1)) / t.cuotas) * 86_400_000),
    monto: i === t.cuotas - 1 ? t.total - t.cuota * (t.cuotas - 1) : t.cuota,
  }));
  t.vence = t.cronograma.at(-1).vence;
  t.historial.push({ t: ahora, e: 'desembolsado', por: norm(quien) });
  return { estado: t.estado };
}

export function abonar(e, quien, { id, monto }, ahora) {
  const t = trato(e, id);
  if (parte(t, quien) !== 'prestatario') fallo('NoAutorizado', 'Solo quien recibió el préstamo puede abonar.');
  if (t.estado !== 'activo') fallo('Estado', t.estado === 'pagado' ? 'Este trato ya está pagado.' : 'Este trato todavía no tiene dinero desembolsado.');
  const m = entero(monto, 'El abono');
  const pendiente = t.total - t.pagado;
  if (m <= 0) fallo('Invalido', 'El abono debe ser mayor que cero.');
  if (m > pendiente) fallo('Invalido', `No puedes abonar más de lo que debes: Bs ${enBs(pendiente)}.`);
  mover(e, t.prestatario, t.prestamista, m, 'abono', `Trato ${t.id}`, ahora);
  t.pagos.push({ t: ahora, monto: m });
  t.pagado += m;
  if (t.pagado >= t.total) {
    t.estado = 'pagado';
    t.completado = ahora;
    t.aTiempo = ahora <= t.vence;
    t.historial.push({ t: ahora, e: 'pagado', por: norm(quien) });
  }
  return { estado: t.estado, pendiente: t.total - t.pagado };
}

// ------------------------------------------------------------------------------------------------ calificaciones
// La otra persona muestra un QR que cambia cada 30 s (firmado con su cuenta). Quien califica lo escanea: así se prueba
// que están frente a frente. La ruta verifica la firma; aquí se valida el resto.

export function calificar(e, quien, { id, estrellas, comentario, codigo }, ahora) {
  const t = trato(e, id);
  const yo = parte(t, quien);
  if (t.estado !== 'activo' && t.estado !== 'pagado') fallo('Estado', 'Solo se califica un trato con dinero desembolsado.');
  const otro = yo === 'prestamista' ? t.prestatario : t.prestamista;
  if (norm(codigo?.a) !== otro) fallo('CodigoInvalido', 'Ese código no es de la otra persona de este trato.');
  const edad = ahora - codigo.t * 1000;
  if (edad > REGLAS.VIDA_QR_SEG * 1000 || edad < -30_000) fallo('CodigoVencido', 'El código venció. Pídele que muestre el nuevo (cambia cada 30 segundos).');
  if (e.usados[codigo.n]) fallo('CodigoUsado', 'Ese código ya se usó. Pídele el nuevo.');
  const est = entero(estrellas, 'La calificación');
  if (est < 1 || est > 5) fallo('Invalido', 'La calificación va de 1 a 5 estrellas.');
  if (t.calif[norm(quien)]) fallo('Duplicado', 'Ya calificaste este trato.');
  t.calif[norm(quien)] = { a: otro, estrellas: est, comentario: String(comentario ?? '').slice(0, 140), t: ahora };
  e.usados[codigo.n] = ahora;
  for (const [n, t0] of Object.entries(e.usados)) if (ahora - t0 > 10 * 60_000) delete e.usados[n];
  return { ok: true };
}

// ------------------------------------------------------------------------------------------------ reputación y vistas

export function reputacion(e, addr) {
  const a = norm(addr);
  const mios = Object.values(e.tratos).filter((t) => t.prestamista === a || t.prestatario === a);
  const comoDeudor = mios.filter((t) => t.prestatario === a && t.estado === 'pagado');
  const aTiempo = comoDeudor.filter((t) => t.aTiempo).length;
  const recibidas = Object.values(e.tratos).flatMap((t) => Object.values(t.calif).filter((c) => c.a === a));
  const promedio = recibidas.length ? recibidas.reduce((s, c) => s + c.estrellas, 0) / recibidas.length : null;
  const personas = new Set(mios.filter((t) => t.estado === 'pagado' || t.estado === 'activo').map((t) => (t.prestamista === a ? t.prestatario : t.prestamista))).size;
  const pagados = comoDeudor.length;
  let nivel = '🌱 Nuevo';
  if (pagados >= 10 && aTiempo === pagados) nivel = '🏆 Palabra de oro';
  else if (pagados >= 5 && aTiempo / pagados >= 0.9) nivel = '⭐ Muy cumplido';
  else if (pagados >= 2 && aTiempo / pagados >= 0.7) nivel = '🤝 Cumplido';
  const ratioTiempo = pagados ? aTiempo / pagados : null;
  const puntaje = pagados || recibidas.length
    ? Math.round(1000 * (0.5 * (ratioTiempo ?? 0.6) + 0.3 * ((promedio ?? 3) / 5) + 0.2 * Math.min(1, pagados / 10)))
    : null;
  return {
    addr: a, nivel, puntaje, promedio, calificaciones: recibidas.length, pagados, aTiempo, personas,
    ultimas: recibidas.sort((x, y) => y.t - x.t).slice(0, 5).map((c) => ({ estrellas: c.estrellas, comentario: c.comentario, t: c.t })),
  };
}

export function vistaPublicaciones(e, { viendo, tipo } = {}) {
  const v = norm(viendo);
  return Object.values(e.ofertas)
    .filter((o) => o.estado === 'abierta' && (!tipo || o.tipo === tipo))
    .sort((a, b) => b.creada - a.creada)
    .map((o) => ({
      ...o, interesados: undefined, nInteresados: o.interesados.length, yoInteresado: o.interesados.some((i) => i.addr === v), soyAutor: o.autor === v,
      condiciones: calcularCondiciones(o), reputacion: reputacion(e, o.autor),
    }));
}

export function vistaPublicacion(e, id, viendo) {
  const o = e.ofertas[id] ?? fallo('NoExiste', 'La publicación no existe.');
  const v = norm(viendo);
  const soyAutor = o.autor === v;
  return {
    ...o,
    interesados: soyAutor ? o.interesados.map((i) => ({ ...i, reputacion: reputacion(e, i.addr) })) : undefined,
    nInteresados: o.interesados.length,
    yoInteresado: o.interesados.some((i) => i.addr === v),
    soyAutor,
    condiciones: calcularCondiciones(o),
    reputacion: reputacion(e, o.autor),
  };
}

export function vistaTratos(e, quien) {
  const q = norm(quien);
  return Object.values(e.tratos)
    .filter((t) => t.prestamista === q || t.prestatario === q)
    .sort((a, b) => b.creado - a.creado)
    .map((t) => ({ ...t, miRol: t.prestamista === q ? 'prestamista' : 'prestatario' }));
}

export function vistaCuenta(e, quien) {
  const c = cuenta(e, quien);
  return { saldo: c.saldo, mov: c.mov, depositadoHoy: c.dep.total };
}

// ------------------------------------------------------------------------------------------------ búsqueda para el asistente

export function convertir(montoCentavos, desde, hacia) {
  if (desde === hacia) return montoCentavos;
  return desde === 'USD'
    ? Math.round(montoCentavos * REGLAS.TIPO_CAMBIO_BOB_POR_USD)
    : Math.round(montoCentavos / REGLAS.TIPO_CAMBIO_BOB_POR_USD);
}

// Busca publicaciones abiertas que cuadren con un presupuesto y una moneda. No necesita permiso de gasto.
export function buscar(e, { presupuesto, moneda = 'BOB', tipo, plazoMaxDias, tasaMaxMensual, viendo } = {}) {
  const mon = moneda === 'USD' ? 'USD' : 'BOB';
  const tope = presupuesto != null ? convertir(aCentavos(presupuesto), mon, 'BOB') : null;
  return vistaPublicaciones(e, { viendo, tipo })
    .filter((o) => (tope == null || o.monto <= tope) && (plazoMaxDias == null || o.plazoDias <= plazoMaxDias) && (tasaMaxMensual == null || o.tasaMensual <= tasaMaxMensual))
    .sort((a, b) => a.tasaMensual - b.tasaMensual || b.monto - a.monto)
    .slice(0, 6)
    .map((o) => ({
      id: o.id, tipo: o.tipo, monto_bs: enBs(o.monto), monto_usd: (o.monto / 100 / REGLAS.TIPO_CAMBIO_BOB_POR_USD).toFixed(2),
      plazo_dias: o.plazoDias, cuotas: o.cuotas, tasa_mensual_pct: o.tasaMensual, total_a_devolver_bs: enBs(o.condiciones.total),
      nivel_autor: o.reputacion.nivel, interesados: o.nInteresados, nota: o.nota,
    }));
}

export const ACCIONES = {
  depositar, retirar, publicar, cerrarPublicacion, interesar, quitarInteres, elegir, aceptar, cancelar, desembolsar, abonar, calificar,
};
