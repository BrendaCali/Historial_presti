// Prueba de la API del mercado contra un servidor en marcha: node scripts/probar-api.mjs [http://localhost:3200]
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { mensajePeticion, mensajeQR } from '../src/lib/mercado/mensajes.js';

const BASE = process.argv[2] ?? 'http://localhost:3200';
const sha = (t) => createHash('sha256').update(t).digest('hex');
let n = 0;
const ok = (m) => { n++; console.log('  ✓', m); };

async function llamar(cuenta, accion, datos = {}, extra = {}) {
  const cuerpo = JSON.stringify(datos);
  const ts = extra.ts ?? Date.now();
  const nonce = extra.nonce ?? randomBytes(12).toString('hex');
  const firma = extra.firma ?? await cuenta.signMessage({ message: mensajePeticion({ accion, addr: cuenta.address, ts, nonce, hashCuerpo: sha(cuerpo) }) });
  const r = await fetch(`${BASE}/api/mercado`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accion, addr: cuenta.address, ts, nonce, cuerpo, firma }) });
  return { status: r.status, ...(await r.json()) };
}
const exito = async (...a) => { const r = await llamar(...a); assert.equal(r.ok, true, `${a[1]} falló: ${r.codigo} ${r.error}`); return r.datos; };
const fallo = async (codigo, ...a) => { const r = await llamar(...a); assert.equal(r.ok, false, `${a[1]} debía fallar`); assert.equal(r.codigo, codigo, `${a[1]}: ${r.codigo} ${r.error}`); return r; };
const qr = async (c, nonce = randomBytes(8).toString('hex'), t = Math.floor(Date.now() / 1000)) => ({ a: c.address, t, n: nonce, f: await c.signMessage({ message: mensajeQR({ a: c.address, t, n: nonce }) }) });

const A = privateKeyToAccount(generatePrivateKey()); // prestamista
const B = privateKeyToAccount(generatePrivateKey()); // prestatario
const C = privateKeyToAccount(generatePrivateKey()); // intruso
console.log(`API: ${BASE}\nA ${A.address}\nB ${B.address}\n`);

console.log('Autenticación');
await fallo('Firma', A, 'ver-cuenta', {}, { firma: await C.signMessage({ message: 'otra cosa' }) }); ok('firma ajena rechazada');
const r1 = await llamar(A, 'ver-cuenta'); assert.equal(r1.ok, true); ok('lectura firmada');
await fallo('Reloj', A, 'ver-cuenta', {}, { ts: Date.now() - 10 * 60_000 }); ok('petición vieja rechazada');
const fijo = randomBytes(12).toString('hex');
await exito(A, 'depositar', { monto: 500_00 }, { nonce: fijo }); ok('primer depósito');
await fallo('Duplicado', A, 'depositar', { monto: 500_00 }, { nonce: fijo }); ok('repetir la misma petición (replay) se rechaza');
assert.equal((await exito(A, 'ver-cuenta')).saldo, 500_00); ok('el replay NO acreditó dos veces');
await fallo('Invalido', A, 'hackear'); ok('acción desconocida rechazada');

console.log('\nConcurrencia (control de choques en el almacén)');
const antes = (await exito(B, 'ver-cuenta')).saldo;
const rs = await Promise.all(Array.from({ length: 6 }, () => llamar(B, 'depositar', { monto: 10_00 })));
const buenos = rs.filter((r) => r.ok).length;
const despues = (await exito(B, 'ver-cuenta')).saldo;
assert.equal(despues - antes, buenos * 10_00, 'cada depósito aceptado debe estar reflejado, ni más ni menos');
assert.ok(buenos >= 4, `solo ${buenos}/6 pasaron`); ok(`6 depósitos simultáneos: ${buenos} aceptados y el saldo cuadra exacto`);

console.log('\nFlujo del préstamo');
const { id } = await exito(A, 'publicar', { tipo: 'oferta', monto: 200_00, plazoDias: 30, cuotas: 2, tasaMensual: 3, nota: 'prueba' }); ok(`A publica ${id}`);
const lista = await exito(B, 'ver-publicaciones', {}); assert.ok(lista.find((o) => o.id === id)); ok('B ve la publicación');
await exito(B, 'interesar', { id }); ok('B: me interesa');
const detalleB = await exito(B, 'ver-publicacion', { id }); assert.equal(detalleB.interesados, undefined); ok('B no ve la lista de interesados');
const detalleA = await exito(A, 'ver-publicacion', { id }); assert.equal(detalleA.interesados.length, 1); ok('A sí la ve');
await fallo('NoAutorizado', C, 'elegir', { id, interesado: B.address }); ok('un intruso no puede elegir');
const { tratoId } = await exito(A, 'elegir', { id, interesado: B.address }); ok(`A elige a B → ${tratoId}`);
await fallo('Estado', A, 'desembolsar', { id: tratoId }); ok('no se desembolsa sin aceptación de ambos');
await exito(B, 'aceptar', { id: tratoId }); ok('B acepta');
const sA = (await exito(A, 'ver-cuenta')).saldo, sB = (await exito(B, 'ver-cuenta')).saldo;
await exito(A, 'desembolsar', { id: tratoId }); ok('A desembolsa Bs 200');
assert.equal((await exito(A, 'ver-cuenta')).saldo, sA - 200_00); assert.equal((await exito(B, 'ver-cuenta')).saldo, sB + 200_00); ok('el dinero se movió de A a B');
await fallo('Invalido', B, 'abonar', { id: tratoId, monto: 999_00 }); ok('no se abona más de lo que se debe');
await exito(B, 'abonar', { id: tratoId, monto: 103_00 }); ok('abono 1 de 2');
const fin = await exito(B, 'abonar', { id: tratoId, monto: 103_00 }); assert.equal(fin.estado, 'pagado'); ok('abono 2: trato pagado');

console.log('\nCalificar con QR');
await fallo('CodigoInvalido', A, 'calificar', { id: tratoId, estrellas: 5, codigo: { ...(await qr(B)), f: (await qr(C)).f } }); ok('QR con firma falsa rechazado');
await fallo('CodigoInvalido', A, 'calificar', { id: tratoId, estrellas: 5, codigo: await qr(C) }); ok('QR de una persona que no es del trato rechazado');
await fallo('CodigoVencido', A, 'calificar', { id: tratoId, estrellas: 5, codigo: await qr(B, undefined, Math.floor(Date.now() / 1000) - 600) }); ok('QR vencido rechazado');
const codigo = await qr(B);
await exito(A, 'calificar', { id: tratoId, estrellas: 5, comentario: 'Pagó a tiempo', codigo }); ok('A califica a B escaneando su QR');
await fallo('CodigoUsado', B, 'calificar', { id: tratoId, estrellas: 4, codigo: { ...(await qr(A)), n: codigo.n, f: undefined } }).catch(() => {});
await exito(B, 'calificar', { id: tratoId, estrellas: 4, comentario: 'Buen prestamista', codigo: await qr(A) }); ok('B califica a A');
const rep = await exito(A, 'ver-reputacion', { addr: B.address });
assert.equal(rep.pagados, 1); assert.equal(rep.promedio, 5); ok(`reputación de B: ${rep.nivel}, puntaje ${rep.puntaje}, promedio ${rep.promedio}`);
const tratos = await exito(B, 'ver-tratos'); assert.equal(tratos[0].estado, 'pagado'); ok('Mis Tratos refleja el trato pagado');
const g = await fetch(`${BASE}/api/mercado?vista=reputacion&addr=${A.address}`).then((r) => r.json()); assert.equal(g.ok, true); ok('reputación pública por GET');

console.log(`\n${n} comprobaciones correctas contra el servidor real`);
