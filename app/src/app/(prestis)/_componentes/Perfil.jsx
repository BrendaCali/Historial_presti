'use client';

import Link from 'next/link';
import { corta, estrellas, fecha } from '../../../lib/formato';
import { useAval } from '../../AvalProvider';
import Icono from './Icono';
import { useVista } from './useMercado';

// Perfil y reputación. Todo sale de los tratos y calificaciones reales: una cuenta nueva empieza en "Nuevo", sin puntaje.
export default function Perfil({ addr }) {
  const { direccion } = useAval();
  const propio = !addr || addr.toLowerCase() === direccion.toLowerCase();
  const { datos: r, error } = useVista('ver-reputacion', propio ? {} : { addr });

  if (!r) return <p className={`font-body-sm text-body-sm ${error ? 'text-error' : 'text-on-surface-variant'}`}>{error || 'Cargando…'}</p>;
  const pct = r.pagados ? Math.round((r.aTiempo / r.pagados) * 100) : null;

  return (
    <>
      <section className="bg-surface-container rounded-xl p-space-lg shadow-lg flex flex-col sm:flex-row sm:items-center gap-space-md">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0"><Icono nombre="person" tam={32} /></div>
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="font-headline-sm text-headline-sm text-on-surface">{propio ? 'Tu perfil' : 'Perfil'}</h1>
          <span className="font-metric-mono text-label-md text-secondary break-all">{propio ? direccion : r.addr}</span>
          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container self-start">{r.nivel}</span>
        </div>
        <div className="sm:ml-auto text-left sm:text-right">
          <span className="font-metric-mono text-label-sm uppercase text-on-surface-variant block">Puntaje</span>
          <span className="font-display-score-mobile text-display-score-mobile text-primary leading-none">{r.puntaje ?? '—'}</span>
          <span className="font-metric-mono text-label-sm text-secondary block">{r.puntaje == null ? 'sin historial todavía' : 'de 1000'}</span>
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm text-center">
        {[
          ['Calificación', r.promedio != null ? `${r.promedio.toFixed(1)} ★` : '—'],
          ['Calificaciones', r.calificaciones],
          ['Préstamos pagados', r.pagados],
          ['Pagos a tiempo', pct != null ? `${pct}%` : '—'],
        ].map(([k, v]) => (
          <div key={k} className="bg-surface-container rounded-xl py-space-sm">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">{k}</span>
            <span className="font-headline-sm text-headline-sm text-on-surface">{v}</span>
          </div>
        ))}
      </section>

      <section className="bg-surface-container rounded-xl p-space-md flex flex-col gap-space-sm">
        <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs"><Icono nombre="reviews" tam={20} className="text-primary" /> Últimas calificaciones</h2>
        {r.ultimas.length === 0 && <p className="font-body-sm text-body-sm text-on-surface-variant">Todavía no hay calificaciones. Se reciben al terminar tratos, escaneando el código de la otra persona.</p>}
        {r.ultimas.map((c) => (
          <div key={c.t} className="bg-surface-container-low rounded-lg p-space-sm flex flex-col">
            <span className="text-tertiary">{estrellas(c.estrellas)} <span className="font-label-sm text-label-sm text-on-surface-variant">{fecha(c.t)}</span></span>
            {c.comentario && <span className="font-body-sm text-body-sm text-on-surface">“{c.comentario}”</span>}
          </div>
        ))}
      </section>

      {propio && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
          {[['/mi-codigo', 'qr_code_2', 'Mi código'], ['/billetera', 'account_balance_wallet', 'Billetera'], ['/permiso', 'shield_person', 'Permiso de pagos'], ['/actividad', 'receipt_long', 'Actividad']].map(([h, i, t]) => (
            <Link key={h} href={h} className="bg-surface-container hover:bg-surface-container-high rounded-xl p-space-sm flex flex-col items-center gap-1 text-center">
              <Icono nombre={i} tam={24} className="text-primary" /><span className="font-label-md text-label-md text-on-surface">{t}</span>
            </Link>
          ))}
        </section>
      )}
      {!propio && <p className="font-label-sm text-label-sm text-on-surface-variant">Cuenta {corta(r.addr)} · {r.personas} persona{r.personas === 1 ? '' : 's'} distinta{r.personas === 1 ? '' : 's'} en sus tratos.</p>}
    </>
  );
}
