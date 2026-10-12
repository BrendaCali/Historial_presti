'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { REGLAS, calcularCondiciones } from '../../../lib/mercado/logica';
import { aCentavos, bs } from '../../../lib/formato';
import Icono from '../_componentes/Icono';
import { Condiciones, Persona } from '../_componentes/Tarjetas';
import { useAccion, useVista } from '../_componentes/useMercado';

const FILTROS = [
  { id: '', texto: 'Todos' },
  { id: 'oferta', texto: 'Puedo prestar' },
  { id: 'solicitud', texto: 'Necesito préstamo' },
];

const campo = 'w-full h-11 px-3 rounded-lg bg-surface-container-high text-on-surface border border-surface-variant focus:outline-2 focus:outline-primary';

export default function Mercado() {
  const [filtro, setFiltro] = useState('');
  const [abierto, setAbierto] = useState(false);
  const { datos, error, recargar } = useVista('ver-publicaciones', { tipo: filtro || undefined });
  const { ocupado, ejecutar } = useAccion(recargar);

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}
        className="w-full h-13 py-3 px-space-md bg-primary hover:bg-primary-fixed-dim active:scale-[0.99] transition-all rounded-xl flex items-center justify-between shadow-lg shadow-primary/20 text-on-primary">
        <span className="flex items-center gap-2 font-label-lg text-label-lg font-bold"><Icono nombre="add" tam={20} /> Publicar una oferta o una solicitud</span>
        <Icono nombre="arrow_forward" tam={20} />
      </button>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 sin-scrollbar" role="tablist" aria-label="Filtro">
        {FILTROS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filtro === f.id} onClick={() => setFiltro(f.id)}
            className={`shrink-0 h-9 px-3.5 rounded-full font-label-md text-label-md transition-all ${filtro === f.id ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface hover:text-primary'}`}>
            {f.texto}
          </button>
        ))}
        <span className="ml-auto font-label-sm text-label-sm text-on-surface-variant shrink-0">{datos ? `${datos.length} abierta${datos.length === 1 ? '' : 's'}` : ''}</span>
      </div>

      {error && !datos && <p className="text-error font-body-sm text-body-sm" role="alert">{error}</p>}
      {datos && datos.length === 0 && (
        <div className="bg-surface-container rounded-xl p-space-xl text-center flex flex-col items-center gap-space-sm">
          <Icono nombre="dashboard" tam={32} className="text-primary" />
          <p className="font-headline-sm text-headline-sm text-on-surface">Todavía no hay publicaciones.</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">Publica la primera: lo que ofreces prestar, o lo que necesitas. Otra persona puede mostrar interés y cerrar el trato contigo.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 items-start">
        {datos?.map((o) => (
          <article key={o.id} className="relative bg-surface-container rounded-xl p-space-md shadow-md flex flex-col gap-space-sm overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${o.tipo === 'oferta' ? 'bg-primary' : 'bg-tertiary'}`} />
            <div className="flex items-start justify-between gap-2">
              <Persona addr={o.autor} r={o.reputacion} yo={o.soyAutor} />
              <span className={`shrink-0 font-metric-mono text-label-sm uppercase px-2 py-0.5 rounded ${o.tipo === 'oferta' ? 'bg-primary-container/20 text-primary' : 'bg-tertiary/20 text-tertiary'}`}>
                {o.tipo === 'oferta' ? 'Ofrece' : 'Solicita'}
              </span>
            </div>
            <Condiciones o={o} />
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-surface-variant/40">
              <span className="font-label-sm text-label-sm text-primary font-semibold">{o.nInteresados} interesado{o.nInteresados === 1 ? '' : 's'}</span>
              <div className="flex gap-2">
                {o.soyAutor ? (
                  <Link href={`/tablon/${o.id}`} className="h-9 px-3 rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md flex items-center gap-1">
                    Ver interesados <Icono nombre="chevron_right" tam={16} />
                  </Link>
                ) : (
                  <>
                    <Link href={`/tablon/${o.id}`} className="h-9 px-3 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md flex items-center">Detalle</Link>
                    <button type="button" disabled={!!ocupado} aria-pressed={o.yoInteresado}
                      onClick={() => ejecutar(`i-${o.id}`, o.yoInteresado ? 'quitarInteres' : 'interesar', { id: o.id }, o.yoInteresado ? 'Quitaste tu interés.' : 'Mostraste interés. Quien publicó verá tu perfil.')}
                      className={`h-9 px-4 rounded-lg font-label-md text-label-md font-bold flex items-center gap-1 disabled:opacity-60 ${o.yoInteresado ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary text-on-primary hover:bg-primary-fixed'}`}>
                      <Icono nombre={o.yoInteresado ? 'check' : 'handshake'} tam={18} />{o.yoInteresado ? 'Interesado' : 'Me interesa'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {abierto && <Publicar onCerrar={() => setAbierto(false)} ocupado={ocupado === 'pub'} onPublicar={(d) => ejecutar('pub', 'publicar', d, 'Publicaste. Ya la pueden ver.').then((r) => r && setAbierto(false))} />}
    </>
  );
}

function Publicar({ onCerrar, onPublicar, ocupado }) {
  const [tipo, setTipo] = useState('oferta');
  const [monto, setMonto] = useState('');
  const [plazo, setPlazo] = useState('30');
  const [cuotas, setCuotas] = useState('1');
  const [tasa, setTasa] = useState('2');
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const tecla = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onCerrar]);

  const m = aCentavos(monto);
  const vista = m && Number(plazo) >= 1 && Number(cuotas) >= 1 ? calcularCondiciones({ monto: m, plazoDias: Number(plazo), tasaMensual: Number(tasa) || 0, cuotas: Number(cuotas) }) : null;

  const enviar = (e) => {
    e.preventDefault();
    if (!m || m < REGLAS.MIN_CENTAVOS || m > REGLAS.MAX_CENTAVOS) return setError(`El monto va de ${bs(REGLAS.MIN_CENTAVOS)} a ${bs(REGLAS.MAX_CENTAVOS)}.`);
    const p = Number(plazo), c = Number(cuotas), t = Number(tasa);
    if (!Number.isInteger(p) || p < 1 || p > REGLAS.MAX_PLAZO_DIAS) return setError(`El plazo va de 1 a ${REGLAS.MAX_PLAZO_DIAS} días.`);
    if (!Number.isInteger(c) || c < 1 || c > REGLAS.MAX_CUOTAS || c > p) return setError(`Las cuotas van de 1 a ${REGLAS.MAX_CUOTAS} y no pueden pasar del plazo.`);
    if (!Number.isFinite(t) || t < 0 || t > REGLAS.MAX_TASA_MENSUAL) return setError(`La tasa va de 0% a ${REGLAS.MAX_TASA_MENSUAL}% al mes.`);
    setError('');
    onPublicar({ tipo, monto: m, plazoDias: p, cuotas: c, tasaMensual: t, nota: nota.trim() });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60" onClick={onCerrar}>
      <form role="dialog" aria-modal="true" aria-label="Publicar" onClick={(e) => e.stopPropagation()} onSubmit={enviar}
        className="w-full md:max-w-md bg-surface-container rounded-t-2xl md:rounded-2xl p-space-lg shadow-2xl flex flex-col gap-space-sm max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Publicar</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="w-9 h-9 rounded-full hover:bg-surface-container-high flex items-center justify-center"><Icono nombre="close" tam={20} /></button>
        </div>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo">
          {[['oferta', 'Puedo prestar'], ['solicitud', 'Necesito préstamo']].map(([id, t]) => (
            <button key={id} type="button" role="radio" aria-checked={tipo === id} onClick={() => setTipo(id)}
              className={`h-11 rounded-lg font-label-md text-label-md font-semibold ${tipo === id ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>{t}</button>
          ))}
        </div>
        <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">Monto (Bs)
          <input className={campo} inputMode="decimal" placeholder={`Desde ${REGLAS.MIN_CENTAVOS / 100}`} value={monto} onChange={(e) => { setMonto(e.target.value); setError(''); }} />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">Plazo (días)
            <input className={campo} inputMode="numeric" value={plazo} onChange={(e) => { setPlazo(e.target.value); setError(''); }} /></label>
          <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">Cuotas
            <input className={campo} inputMode="numeric" value={cuotas} onChange={(e) => { setCuotas(e.target.value); setError(''); }} /></label>
          <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">Tasa %/mes
            <input className={campo} inputMode="decimal" value={tasa} onChange={(e) => { setTasa(e.target.value); setError(''); }} /></label>
        </div>
        <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">Detalle (opcional)
          <textarea className={`${campo} h-16 py-2`} maxLength={160} placeholder="Para qué es, dónde se encuentran…" value={nota} onChange={(e) => setNota(e.target.value)} /></label>
        {vista && <p className="font-body-sm text-body-sm text-on-surface bg-surface-container-low rounded-lg p-space-sm">Se devolverán <b>{bs(vista.total)}</b> (interés {bs(vista.interes)}) en {cuotas} cuota{Number(cuotas) === 1 ? '' : 's'} de {bs(vista.cuota)}.</p>}
        {error && <p role="alert" className="text-error font-body-sm text-body-sm">{error}</p>}
        <button type="submit" disabled={ocupado} className="h-12 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg font-bold disabled:opacity-60">{ocupado ? 'Publicando…' : 'Publicar'}</button>
      </form>
    </div>
  );
}
