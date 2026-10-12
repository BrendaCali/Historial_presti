'use client';

import Link from 'next/link';
import { bs, corta, estrellas, usdAprox } from '../../../lib/formato';
import Icono from './Icono';

// Resumen de reputación de una persona: nivel, puntaje y estrellas. Se usa en el Tablón, en el detalle y en los perfiles.
export function Reputacion({ r, compacto = false }) {
  if (!r) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">{r.nivel}</span>
      {r.puntaje != null && <span className="font-metric-mono text-label-sm text-primary">{r.puntaje} pts</span>}
      {r.promedio != null && <span className="font-label-sm text-label-sm text-tertiary" title={`${r.calificaciones} calificaciones`}>{estrellas(r.promedio)} {r.promedio.toFixed(1)}</span>}
      {!compacto && <span className="font-label-sm text-label-sm text-on-surface-variant">{r.pagados} pagado{r.pagados === 1 ? '' : 's'}{r.pagados ? ` · ${Math.round((r.aTiempo / r.pagados) * 100)}% a tiempo` : ''}</span>}
    </div>
  );
}

export function Persona({ addr, r, yo }) {
  return (
    <Link href={`/perfil/${addr}`} className="flex items-center gap-2.5 min-w-0 hover:opacity-90">
      <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0"><Icono nombre="person" tam={22} /></div>
      <div className="min-w-0">
        <span className="font-headline-sm text-headline-sm text-on-surface block truncate">{yo ? 'Tú' : corta(addr)}</span>
        <Reputacion r={r} compacto />
      </div>
    </Link>
  );
}

export function Condiciones({ o }) {
  const c = o.condiciones;
  return (
    <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold text-on-surface tracking-tight">{bs(o.monto)}</span>
        <span className="font-metric-mono text-label-sm text-secondary">{usdAprox(o.monto)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[['Plazo', `${o.plazoDias} días`], ['Cuotas', o.cuotas], ['Tasa', `${o.tasaMensual}% /mes`]].map(([t, v]) => (
          <div key={t} className="bg-surface-container-high/60 rounded-lg py-1.5">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">{t}</span>
            <span className="font-metric-mono text-label-md text-on-surface">{v}</span>
          </div>
        ))}
      </div>
      <span className="font-body-sm text-body-sm text-on-surface-variant">
        A devolver <b className="text-on-surface">{bs(c.total)}</b> en {o.cuotas} cuota{o.cuotas === 1 ? '' : 's'} de {bs(c.cuota)} (interés {bs(c.interes)}).
      </span>
      {o.nota && <p className="font-body-sm text-body-sm text-on-surface-variant">“{o.nota}”</p>}
    </div>
  );
}
