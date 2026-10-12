'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { ESTADOS_TRATO, aCentavos, bs, corta, dia, estrellas, fecha } from '../../../../lib/formato';
import { useAval } from '../../../AvalProvider';
import EscanerQR from '../../_componentes/EscanerQR';
import Icono from '../../_componentes/Icono';
import { useAccion, useVista } from '../../_componentes/useMercado';

const campo = 'w-full h-12 px-3 rounded-lg bg-surface-container-high text-on-surface border border-surface-variant focus:outline-2 focus:outline-primary';
const Bloque = ({ icono, titulo, children }) => (
  <section className="bg-surface-container rounded-xl p-space-md shadow-md flex flex-col gap-space-sm">
    <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs"><Icono nombre={icono} tam={20} className="text-primary" /> {titulo}</h2>
    {children}
  </section>
);

export default function Trato({ id }) {
  const { direccion } = useAval();
  const { datos: tratos, error, recargar } = useVista('ver-tratos');
  const { datos: cuenta, recargar: recargarCuenta } = useVista('ver-cuenta');
  const alTerminar = useCallback(async () => { await Promise.all([recargar(), recargarCuenta()]); }, [recargar, recargarCuenta]);
  const { ocupado, ejecutar } = useAccion(alTerminar);

  const t = tratos?.find((x) => x.id === id);
  if (!tratos) return <p className={`font-body-sm text-body-sm ${error ? 'text-error' : 'text-on-surface-variant'}`}>{error || 'Cargando…'}</p>;
  if (!t) return <p className="font-body-sm text-body-sm text-error">No encontramos este trato, o no participas en él.</p>;

  const yo = direccion.toLowerCase();
  const soyPrestamista = t.miRol === 'prestamista';
  const otro = soyPrestamista ? t.prestatario : t.prestamista;
  const est = ESTADOS_TRATO[t.estado];
  const pendiente = t.total - t.pagado;
  const saldo = cuenta?.saldo ?? 0;

  return (
    <>
      <Link href="/mis-tratos" className="self-start font-label-md text-label-md text-primary flex items-center gap-1 hover:underline"><Icono nombre="arrow_back" tam={16} /> Mis tratos</Link>

      <section className="bg-surface-container rounded-xl p-space-md shadow-lg flex flex-col gap-space-sm">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-headline-sm text-headline-sm text-on-surface">Trato {t.id}</span>
          <span className={`font-label-sm text-label-sm px-2.5 py-1 rounded-full font-semibold ${est.color}`}>{est.texto}</span>
        </div>
        <div className="grid grid-cols-2 gap-space-sm">
          {[['Presta', t.prestamista], ['Recibe', t.prestatario]].map(([r, a]) => (
            <Link key={r} href={`/perfil/${a}`} className="bg-surface-container-low rounded-lg p-space-sm hover:bg-surface-container-high">
              <span className="font-label-sm text-label-sm text-on-surface-variant block">{r}</span>
              <span className="font-metric-mono text-label-md text-on-surface">{a === yo ? 'Tú' : corta(a)}</span>
              {t.acepta[a] && <span className="font-label-sm text-label-sm text-primary block">✓ aceptó el {dia(t.acepta[a])}</span>}
              {!t.acepta[a] && t.estado === 'propuesto' && <span className="font-label-sm text-label-sm text-tertiary block">falta que acepte</span>}
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm text-center">
          {[['Préstamo', bs(t.monto)], ['Interés', `${bs(t.interes)} (${t.tasaMensual}%/mes)`], ['A devolver', bs(t.total)], ['Cuotas', `${t.cuotas} × ${bs(t.cuota)}`]].map(([k, v]) => (
            <div key={k} className="bg-surface-container-low rounded-lg py-space-sm px-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant block">{k}</span>
              <span className="font-metric-mono text-label-md text-on-surface break-words">{v}</span>
            </div>
          ))}
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant">Plazo {t.plazoDias} días{t.vence ? ` · vence el ${dia(t.vence)}` : ''}</span>
      </section>

      {/* Aceptación de ambas partes */}
      {t.estado === 'propuesto' && (
        <Bloque icono="how_to_reg" titulo="Falta la aceptación de ambas personas">
          {t.acepta[yo] ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">Tú ya aceptaste. Esperando a {corta(otro)}.</p>
          ) : (
            <>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Revisa las condiciones de arriba. Al aceptar, {soyPrestamista ? 'te comprometes a desembolsar el préstamo' : 'te comprometes a devolver el total en las cuotas indicadas'}.</p>
              <button type="button" disabled={!!ocupado} onClick={() => ejecutar('ac', 'aceptar', { id }, 'Aceptaste el trato.')}
                className="h-12 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg font-bold disabled:opacity-60">{ocupado === 'ac' ? 'Aceptando…' : 'Aceptar el trato'}</button>
            </>
          )}
        </Bloque>
      )}

      {/* Desembolso */}
      {t.estado === 'aceptado' && (
        <Bloque icono="payments" titulo="Desembolso">
          {soyPrestamista ? (
            <>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Ambos aceptaron. Al desembolsar, <b>{bs(t.monto)}</b> pasan de tu billetera a la de {corta(t.prestatario)}. Tu saldo: {bs(saldo)}.</p>
              {saldo < t.monto && <p role="alert" className="text-error font-body-sm text-body-sm">Tu saldo no alcanza. <Link href="/billetera" className="underline">Deposita en tu billetera</Link>.</p>}
              <button type="button" disabled={!!ocupado || saldo < t.monto} onClick={() => ejecutar('des', 'desembolsar', { id }, `Desembolsaste ${bs(t.monto)}.`)}
                className="h-12 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg font-bold disabled:opacity-60">{ocupado === 'des' ? 'Desembolsando…' : `Desembolsar ${bs(t.monto)}`}</button>
            </>
          ) : <p className="font-body-sm text-body-sm text-on-surface-variant">Ambos aceptaron. Esperando que {corta(t.prestamista)} desembolse {bs(t.monto)}. Cuando lo haga, el dinero aparecerá en tu billetera.</p>}
        </Bloque>
      )}

      {(t.estado === 'propuesto' || t.estado === 'aceptado') && (
        <button type="button" disabled={!!ocupado} onClick={() => ejecutar('can', 'cancelar', { id }, 'Trato cancelado. La publicación volvió a abrirse.')}
          className="self-start h-10 px-4 rounded-lg bg-surface-container-high hover:bg-error-container text-error font-label-md text-label-md disabled:opacity-60">Cancelar el trato</button>
      )}

      {/* Cuotas y abonos */}
      {(t.estado === 'activo' || t.estado === 'pagado') && (
        <Bloque icono="calendar_month" titulo="Cuotas y abonos">
          <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden" aria-label="Progreso del pago">
            <div className="h-full bg-primary" style={{ width: `${Math.round((t.pagado / t.total) * 100)}%` }} />
          </div>
          <span className="font-metric-mono text-label-md text-on-surface">Pagado {bs(t.pagado)} de {bs(t.total)} · pendiente {bs(pendiente)}</span>
          <div className="flex flex-col gap-1">
            {t.cronograma.map((c, i) => {
              const acumulado = t.cronograma.slice(0, i + 1).reduce((s, x) => s + x.monto, 0);
              const pagada = t.pagado >= acumulado;
              const vencida = !pagada && Date.now() > c.vence;
              return (
                <div key={c.n} className="bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between gap-2">
                  <span className="font-label-lg text-label-lg text-on-surface">Cuota {c.n} · {dia(c.vence)}</span>
                  <span className="font-metric-mono text-label-md flex items-center gap-2">{bs(c.monto)}
                    <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full ${pagada ? 'bg-primary/20 text-primary' : vencida ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface-variant'}`}>{pagada ? 'pagada' : vencida ? 'vencida' : 'pendiente'}</span></span>
                </div>
              );
            })}
          </div>
          {t.estado === 'activo' && !soyPrestamista && <Abonar t={t} pendiente={pendiente} saldo={saldo} ocupado={ocupado} ejecutar={ejecutar} />}
          {t.estado === 'activo' && soyPrestamista && <p className="font-body-sm text-body-sm text-on-surface-variant">Cuando {corta(t.prestatario)} abone, el dinero llega a tu billetera y aparece aquí.</p>}
          {t.pagos.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Abonos registrados</span>
              {[...t.pagos].reverse().map((p) => <div key={p.t} className="flex justify-between font-metric-mono text-label-md text-on-surface"><span>{fecha(p.t)}</span><span>{bs(p.monto)}</span></div>)}
            </div>
          )}
        </Bloque>
      )}

      {/* Calificación con el QR de la otra persona */}
      {(t.estado === 'activo' || t.estado === 'pagado') && <Calificar t={t} yo={yo} otro={otro} ocupado={ocupado} ejecutar={ejecutar} />}

      <Bloque icono="history" titulo="Historial">
        {t.historial.map((h, i) => <div key={i} className="flex justify-between font-label-md text-label-md text-on-surface-variant"><span className="capitalize">{h.e}</span><span>{fecha(h.t)} · {h.por === yo ? 'tú' : corta(h.por)}</span></div>)}
      </Bloque>
    </>
  );
}

function Abonar({ t, pendiente, saldo, ocupado, ejecutar }) {
  const [monto, setMonto] = useState('');
  const [error, setError] = useState('');
  const proxima = Math.min(pendiente, t.cronograma.find((c, i) => t.pagado < t.cronograma.slice(0, i + 1).reduce((s, x) => s + x.monto, 0))?.monto ?? pendiente);

  const enviar = (e) => {
    e.preventDefault();
    const c = aCentavos(monto);
    if (!c) return setError('Escribe un monto mayor que cero.');
    if (c > pendiente) return setError(`No puedes abonar más de lo que debes: ${bs(pendiente)}.`);
    if (c > saldo) return setError(`Tu saldo (${bs(saldo)}) no alcanza. Deposita primero en tu billetera.`);
    setError('');
    ejecutar('ab', 'abonar', { id: t.id, monto: c }, `Abonaste ${bs(c)}.`).then((r) => r && setMonto(''));
  };
  return (
    <form onSubmit={enviar} className="flex flex-col gap-space-sm bg-surface-container-low rounded-lg p-space-sm">
      <span className="font-label-lg text-label-lg text-on-surface">Abonar · tu saldo {bs(saldo)}</span>
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={() => { setMonto((proxima / 100).toFixed(2)); setError(''); }} className="h-9 px-3 rounded-full bg-surface-container-high text-primary font-label-md text-label-md">Próxima cuota {bs(proxima)}</button>
        <button type="button" onClick={() => { setMonto((pendiente / 100).toFixed(2)); setError(''); }} className="h-9 px-3 rounded-full bg-surface-container-high text-primary font-label-md text-label-md">Pagar todo {bs(pendiente)}</button>
      </div>
      <input className={campo} inputMode="decimal" placeholder="Monto en Bs" value={monto} onChange={(e) => { setMonto(e.target.value); setError(''); }} aria-label="Monto a abonar" />
      {error && <p role="alert" className="text-error font-body-sm text-body-sm">{error} {/saldo/i.test(error) && <Link href="/billetera" className="underline">Ir a mi billetera</Link>}</p>}
      <button type="submit" disabled={!!ocupado} className="h-12 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg font-bold disabled:opacity-60">{ocupado === 'ab' ? 'Abonando…' : 'Abonar'}</button>
    </form>
  );
}

function Calificar({ t, yo, otro, ocupado, ejecutar }) {
  const mia = t.calif[yo];
  const recibida = Object.values(t.calif).find((c) => c.a === yo);
  const [estr, setEstr] = useState(0);
  const [comentario, setComentario] = useState('');
  const [codigo, setCodigo] = useState('');
  const [escaneando, setEscaneando] = useState(false);
  const [error, setError] = useState('');

  const alEscanear = useCallback((texto) => { setCodigo(texto); setEscaneando(false); setError(''); }, []);

  const enviar = (e) => {
    e.preventDefault();
    let c;
    try { c = JSON.parse(codigo); } catch { return setError('Escanea o pega el código de la otra persona.'); }
    if (!estr) return setError('Elige de 1 a 5 estrellas.');
    setError('');
    ejecutar('cal', 'calificar', { id: t.id, estrellas: estr, comentario: comentario.trim(), codigo: c }, 'Calificación enviada.');
  };

  return (
    <Bloque icono="star" titulo="Calificar">
      {recibida && <p className="font-body-sm text-body-sm text-on-surface">Te calificó: <span className="text-tertiary">{estrellas(recibida.estrellas)}</span>{recibida.comentario ? ` “${recibida.comentario}”` : ''}</p>}
      {mia ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">Ya calificaste a {corta(otro)}: <span className="text-tertiary">{estrellas(mia.estrellas)}</span></p>
      ) : (
        <form onSubmit={enviar} className="flex flex-col gap-space-sm">
          <p className="font-body-sm text-body-sm text-on-surface-variant">Para calificar hay que estar frente a frente: {corta(otro)} te muestra su código (<b>Mi código</b>, cambia cada 30 segundos) y tú lo escaneas.</p>
          <div className="flex gap-1" role="radiogroup" aria-label="Estrellas">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={estr === n} aria-label={`${n} estrellas`} onClick={() => setEstr(n)}
                className={`w-11 h-11 rounded-lg text-2xl ${estr >= n ? 'text-tertiary bg-surface-container-high' : 'text-on-surface-variant bg-surface-container-low'}`}>★</button>
            ))}
          </div>
          <input className={campo} maxLength={140} placeholder="Comentario (opcional)" value={comentario} onChange={(e) => setComentario(e.target.value)} />
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => setEscaneando(true)} className="h-11 px-4 rounded-lg bg-surface-container-high hover:bg-surface-bright text-primary font-label-md text-label-md flex items-center gap-1"><Icono nombre="qr_code_scanner" tam={18} /> {codigo ? 'Escanear otra vez' : 'Escanear su código'}</button>
            {codigo && <span className="font-label-md text-label-md text-primary flex items-center gap-1"><Icono nombre="check_circle" tam={18} /> Código recibido</span>}
          </div>
          <details className="font-label-sm text-label-sm text-on-surface-variant"><summary className="cursor-pointer">¿Sin cámara? Pega el código</summary>
            <textarea className={`${campo} h-20 py-2 mt-1 font-metric-mono text-[11px]`} placeholder="Pega aquí el código que te muestra o te envía la otra persona" value={codigo} onChange={(e) => { setCodigo(e.target.value); setError(''); }} />
          </details>
          {error && <p role="alert" className="text-error font-body-sm text-body-sm">{error}</p>}
          <button type="submit" disabled={!!ocupado} className="h-12 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg font-bold disabled:opacity-60">{ocupado === 'cal' ? 'Enviando…' : 'Enviar calificación'}</button>
        </form>
      )}
      <Link href="/mi-codigo" className="self-start h-10 px-4 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md flex items-center gap-1"><Icono nombre="qr_code_2" tam={18} /> Mostrar mi código para que me califiquen</Link>
      {escaneando && <EscanerQR onCodigo={alEscanear} onCerrar={() => setEscaneando(false)} />}
    </Bloque>
  );
}
