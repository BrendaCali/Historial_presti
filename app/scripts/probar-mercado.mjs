// Pruebas de la lógica del mercado (sin red): node scripts/probar-mercado.mjs
import assert from 'node:assert/strict';
import * as L from '../src/lib/mercado/logica.js';

const A = '0xAAAAaaaaAAAAaaaaAAAAaaaaAAAAaaaaAAAAaaaa'; // prestamista
const B = '0xBBBBbbbbBBBBbbbbBBBBbbbbBBBBbbbbBBBBbbbb'; // prestatario
const C = '0xCCCCccccCCCCccccCCCCccccCCCCccccCCCCcccc'; // tercero
const T0 = Date.UTC(2026, 9, 12, 12, 0, 0);
let n = 0;
const ok = (nombre, fn) => { fn(); n++; console.log('  ✓', nombre); };
const rechaza = (nombre, codigo, fn) => {
  try { fn(); } catch (e) {
    assert.ok(e instanceof L.ErrorMercado, `${nombre}: error inesperado ${e}`);
    assert.equal(e.codigo, codigo, `${nombre}: código ${e.codigo}`);
    n++; console.log('  ✓ rechaza:', nombre);
    return;
  }
  assert.fail(`${nombre}: debía rechazarse`);
};
const run = (e, accion, quien, datos, t = T0) => L.ACCIONES[accion](e, quien, datos, t);

console.log('Billetera');
const e = L.estadoVacio();
ok('depósito acredita', () => { assert.equal(run(e, 'depositar', A, { monto: 500_00 }).saldo, 500_00); });
rechaza('depósito sobre el máximo', 'Invalido', () => run(e, 'depositar', A, { monto: 600_00 }));
rechaza('depósito bajo el mínimo', 'Invalido', () => run(e, 'depositar', A, { monto: 5_00 }));
ok('depósitos hasta el tope diario', () => { run(e, 'depositar', A, { monto: 500_00 }); run(e, 'depositar', A, { monto: 500_00 }); });
rechaza('tope diario', 'LimiteDiario', () => run(e, 'depositar', A, { monto: 10_00 }));
ok('retiro descuenta', () => { assert.equal(run(e, 'retirar', A, { monto: 100_00 }).saldo, 1400_00); });
rechaza('retiro sin saldo', 'SaldoInsuficiente', () => run(e, 'retirar', B, { monto: 50_00 }));
ok('el día siguiente se reinicia el tope', () => { run(e, 'depositar', A, { monto: 100_00 }, T0 + 86_400_000); });
run(e, 'depositar', B, { monto: 100_00 });

console.log('Publicar');
let idOferta;
rechaza('monto menor al mínimo', 'Invalido', () => run(e, 'publicar', A, { tipo: 'oferta', monto: 10_00, plazoDias: 30, cuotas: 1, tasaMensual: 2 }));
rechaza('tasa excesiva', 'Invalido', () => run(e, 'publicar', A, { tipo: 'oferta', monto: 200_00, plazoDias: 30, cuotas: 1, tasaMensual: 25 }));
rechaza('más cuotas que días', 'Invalido', () => run(e, 'publicar', A, { tipo: 'oferta', monto: 200_00, plazoDias: 3, cuotas: 5, tasaMensual: 2 }));
rechaza('tipo inválido', 'Invalido', () => run(e, 'publicar', A, { tipo: 'regalo', monto: 200_00, plazoDias: 30, cuotas: 1, tasaMensual: 2 }));
ok('publica una oferta', () => { idOferta = run(e, 'publicar', A, { tipo: 'oferta', monto: 200_00, plazoDias: 30, cuotas: 2, tasaMensual: 3, nota: 'Para feria' }).id; });
ok('condiciones: interés simple mensual', () => { assert.deepEqual(L.calcularCondiciones({ monto: 200_00, plazoDias: 30, tasaMensual: 3, cuotas: 2 }), { interes: 6_00, total: 206_00, cuota: 103_00 }); });
ok('máximo de publicaciones abiertas', () => {
  const x = L.estadoVacio();
  for (let i = 0; i < 5; i++) run(x, 'publicar', A, { tipo: 'oferta', monto: 100_00, plazoDias: 10, cuotas: 1, tasaMensual: 1 });
  assert.throws(() => run(x, 'publicar', A, { tipo: 'oferta', monto: 100_00, plazoDias: 10, cuotas: 1, tasaMensual: 1 }), /5 publicaciones/);
});

console.log('Me interesa');
rechaza('no en la propia', 'NoAutorizado', () => run(e, 'interesar', A, { id: idOferta }));
rechaza('publicación inexistente', 'NoExiste', () => run(e, 'interesar', B, { id: 'P999' }));
ok('B se interesa', () => { assert.equal(run(e, 'interesar', B, { id: idOferta }).interesados, 1); });
rechaza('interés duplicado', 'Duplicado', () => run(e, 'interesar', B, { id: idOferta }));
run(e, 'interesar', C, { id: idOferta });

console.log('Elegir y aceptar');
rechaza('solo el autor elige', 'NoAutorizado', () => run(e, 'elegir', B, { id: idOferta, interesado: B }));
rechaza('solo entre interesados', 'NoExiste', () => run(e, 'elegir', A, { id: idOferta, interesado: '0xdead00000000000000000000000000000000dead' }));
let tid;
ok('A elige a B: nace el trato', () => { tid = run(e, 'elegir', A, { id: idOferta, interesado: B }).tratoId; assert.equal(e.tratos[tid].estado, 'propuesto'); assert.equal(e.ofertas[idOferta].estado, 'en-trato'); });
rechaza('la publicación ya no admite elegir otra vez', 'Estado', () => run(e, 'elegir', A, { id: idOferta, interesado: C }));
rechaza('desembolso antes de aceptar', 'Estado', () => run(e, 'desembolsar', A, { id: tid }));
rechaza('un tercero no puede aceptar', 'NoAutorizado', () => run(e, 'aceptar', C, { id: tid }));
rechaza('el autor ya aceptó al elegir', 'Duplicado', () => run(e, 'aceptar', A, { id: tid }));
ok('B acepta: trato aceptado por ambos', () => { assert.equal(run(e, 'aceptar', B, { id: tid }).estado, 'aceptado'); });

console.log('Desembolso');
rechaza('solo el prestamista desembolsa', 'NoAutorizado', () => run(e, 'desembolsar', B, { id: tid }));
rechaza('sin saldo suficiente', 'SaldoInsuficiente', () => {
  const x = structuredClone(e); x.cuentas[A.toLowerCase()].saldo = 50_00; run(x, 'desembolsar', A, { id: tid });
});
const antes = { a: e.cuentas[A.toLowerCase()].saldo, b: e.cuentas[B.toLowerCase()].saldo };
ok('desembolsa: el dinero se mueve', () => {
  run(e, 'desembolsar', A, { id: tid });
  assert.equal(e.cuentas[A.toLowerCase()].saldo, antes.a - 200_00);
  assert.equal(e.cuentas[B.toLowerCase()].saldo, antes.b + 200_00);
  assert.equal(e.tratos[tid].estado, 'activo');
  assert.equal(e.tratos[tid].cronograma.length, 2);
});
rechaza('no se desembolsa dos veces', 'Estado', () => run(e, 'desembolsar', A, { id: tid }));
rechaza('ya no se cancela con dinero', 'Estado', () => run(e, 'cancelar', B, { id: tid }));

console.log('Abonos');
rechaza('solo el prestatario abona', 'NoAutorizado', () => run(e, 'abonar', A, { id: tid, monto: 50_00 }));
rechaza('abono en cero', 'Invalido', () => run(e, 'abonar', B, { id: tid, monto: 0 }));
rechaza('abono mayor a la deuda', 'Invalido', () => run(e, 'abonar', B, { id: tid, monto: 999_00 }));
ok('abono parcial', () => { const r = run(e, 'abonar', B, { id: tid, monto: 103_00 }, T0 + 5 * 86_400_000); assert.equal(r.estado, 'activo'); assert.equal(r.pendiente, 103_00); });
ok('abono final cierra el trato a tiempo', () => { const r = run(e, 'abonar', B, { id: tid, monto: 103_00 }, T0 + 20 * 86_400_000); assert.equal(r.estado, 'pagado'); assert.equal(e.tratos[tid].aTiempo, true); });
rechaza('no se abona un trato pagado', 'Estado', () => run(e, 'abonar', B, { id: tid, monto: 10_00 }));
ok('el dinero cuadra (nada se crea ni se pierde)', () => {
  const total = Object.values(e.cuentas).reduce((s, c) => s + c.saldo, 0);
  const depositos = 1500_00 + 100_00 + 100_00; // A: tope diario + 1 al día siguiente; B: 100
  const retiros = 100_00;
  assert.equal(total, depositos - retiros);
});

console.log('Calificar (QR)');
const codigo = (a, t = T0 / 1000, nonce = 'n1') => ({ a, t, n: nonce });
rechaza('código de otra persona', 'CodigoInvalido', () => run(e, 'calificar', A, { id: tid, estrellas: 5, codigo: codigo(C) }));
rechaza('código de uno mismo', 'CodigoInvalido', () => run(e, 'calificar', A, { id: tid, estrellas: 5, codigo: codigo(A) }));
rechaza('código vencido', 'CodigoVencido', () => run(e, 'calificar', A, { id: tid, estrellas: 5, codigo: codigo(B, T0 / 1000 - 600) }));
rechaza('estrellas fuera de rango', 'Invalido', () => run(e, 'calificar', A, { id: tid, estrellas: 9, codigo: codigo(B) }));
ok('A califica a B con el QR de B', () => { run(e, 'calificar', A, { id: tid, estrellas: 5, comentario: 'Pagó puntual', codigo: codigo(B) }); });
rechaza('el código ya se usó', 'CodigoUsado', () => run(e, 'calificar', B, { id: tid, estrellas: 4, codigo: codigo(A, T0 / 1000, 'n1') }));
rechaza('no se califica dos veces', 'Duplicado', () => run(e, 'calificar', A, { id: tid, estrellas: 4, codigo: codigo(B, T0 / 1000, 'n2') }));
ok('B califica a A con otro código', () => { run(e, 'calificar', B, { id: tid, estrellas: 4, codigo: codigo(A, T0 / 1000, 'n3') }); });
rechaza('un tercero no califica', 'NoAutorizado', () => run(e, 'calificar', C, { id: tid, estrellas: 5, codigo: codigo(A, T0 / 1000, 'n4') }));

console.log('Reputación y vistas');
ok('B: 1 pagado a tiempo y 5 estrellas', () => { const r = L.reputacion(e, B); assert.equal(r.pagados, 1); assert.equal(r.aTiempo, 1); assert.equal(r.promedio, 5); assert.ok(r.puntaje > 800); });
ok('una cuenta nueva es "Nuevo" y sin puntaje', () => { const r = L.reputacion(e, C); assert.equal(r.nivel, '🌱 Nuevo'); assert.equal(r.puntaje, null); });
ok('el autor ve los interesados; los demás solo el conteo', () => {
  const x = L.estadoVacio(); run(x, 'depositar', A, { monto: 100_00 });
  const id = run(x, 'publicar', A, { tipo: 'solicitud', monto: 100_00, plazoDias: 10, cuotas: 1, tasaMensual: 1 }).id;
  run(x, 'interesar', B, { id });
  assert.equal(L.vistaPublicacion(x, id, A).interesados.length, 1);
  assert.equal(L.vistaPublicacion(x, id, B).interesados, undefined);
  assert.equal(L.vistaPublicacion(x, id, B).nInteresados, 1);
});
ok('solicitud: el interesado es quien presta', () => {
  const x = L.estadoVacio(); run(x, 'depositar', A, { monto: 300_00 });
  const id = run(x, 'publicar', B, { tipo: 'solicitud', monto: 100_00, plazoDias: 10, cuotas: 1, tasaMensual: 1 }).id;
  run(x, 'interesar', A, { id });
  const t = run(x, 'elegir', B, { id, interesado: A }).tratoId;
  assert.equal(x.tratos[t].prestamista, A.toLowerCase());
  assert.equal(x.tratos[t].prestatario, B.toLowerCase());
  run(x, 'aceptar', A, { id: t }); run(x, 'desembolsar', A, { id: t });
  assert.equal(x.cuentas[B.toLowerCase()].saldo, 100_00);
});
ok('cancelar antes del desembolso reabre la publicación', () => {
  const x = L.estadoVacio();
  const id = run(x, 'publicar', A, { tipo: 'oferta', monto: 100_00, plazoDias: 10, cuotas: 1, tasaMensual: 1 }).id;
  run(x, 'interesar', B, { id }); const t = run(x, 'elegir', A, { id, interesado: B }).tratoId;
  run(x, 'cancelar', B, { id: t });
  assert.equal(x.ofertas[id].estado, 'abierta'); assert.equal(x.tratos[t].estado, 'cancelado');
});

console.log('Búsqueda del asistente');
const f = L.estadoVacio();
run(f, 'publicar', A, { tipo: 'oferta', monto: 100_00, plazoDias: 15, cuotas: 1, tasaMensual: 2 });
run(f, 'publicar', A, { tipo: 'oferta', monto: 500_00, plazoDias: 60, cuotas: 3, tasaMensual: 4 });
run(f, 'publicar', B, { tipo: 'solicitud', monto: 300_00, plazoDias: 30, cuotas: 1, tasaMensual: 3 });
ok('presupuesto en Bs', () => { assert.equal(L.buscar(f, { presupuesto: 150, moneda: 'BOB' }).length, 1); });
ok('presupuesto en dólares se convierte (50 USD ≈ Bs 348)', () => { assert.equal(L.buscar(f, { presupuesto: 50, moneda: 'USD' }).length, 2); });
ok('filtra por tipo y tasa', () => { assert.equal(L.buscar(f, { presupuesto: 1000, tipo: 'oferta', tasaMaxMensual: 3 }).length, 1); });
ok('sin presupuesto devuelve todo, ordenado por tasa', () => { const r = L.buscar(f, {}); assert.equal(r.length, 3); assert.equal(r[0].tasa_mensual_pct, 2); });
ok('la búsqueda no requiere ningún permiso ni cuenta', () => { assert.ok(Array.isArray(L.buscar(f, { presupuesto: 100 }))); });

console.log(`\n${n} comprobaciones correctas`);
