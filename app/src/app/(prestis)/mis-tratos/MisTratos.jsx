'use client';

import Link from 'next/link';
import { ESTADOS_TRATO, bs, corta, dia } from '../../../lib/formato';
import { useAval } from '../../AvalProvider';
import Icono from '../_componentes/Icono';
import { useVista } from '../_componentes/useMercado';

// Qué le toca hacer a esta persona en cada trato (lo que más importa ver primero).
function pendiente(t, yo) {
  if (t.estado === 'propuesto' && !t.acepta[yo]) return 'Te toca aceptar';
  if (t.estado === 'aceptado' && t.miRol === 'prestamista') return `Te toca desembolsar ${bs(t.monto)}`;
  if (t.estado === 'activo' && t.miRol === 'prestatario') return `Debes ${bs(t.total - t.pagado)}`;
  if ((t.estado === 'activo' || t.estado === 'pagado') && !t.calif[yo]) return 'Falta calificar';
  return null;
}

export default function MisTratos() {
  const { direccion } = useAval();
  const yo = direccion.toLowerCase();
  const { datos: tratos, error } = useVista('ver-tratos');
  const { datos: pubs } = useVista('ver-publicaciones', {});

  if (!tratos) return <p className={`font-body-sm text-body-sm ${error ? 'text-error' : 'text-on-surface-variant'}`}>{error || 'Cargando…'}</p>;
  const mias = (pubs ?? []).filter((p) => p.soyAutor);
  const grupos = [
    ['Requieren tu atención', tratos.filter((t) => pendiente(t, yo) && t.estado !== 'cancelado')],
    ['Activos y en curso', tratos.filter((t) => !pendiente(t, yo) && ['propuesto', 'aceptado', 'activo'].includes(t.estado))],
    ['Cerrados', tratos.filter((t) => !pendiente(t, yo) && ['pagado', 'cancelado'].includes(t.estado))],
  ];

  return (
    <>
      {tratos.length === 0 && mias.length === 0 && (
        <div className="bg-surface-container rounded-xl p-space-xl text-center flex flex-col items-center gap-space-sm">
          <Icono nombre="handshake" tam={32} className="text-primary" />
          <p className="font-headline-sm text-headline-sm text-on-surface">Todavía no tienes tratos.</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">Muestra interés en una publicación del Tablón, o publica la tuya. Cuando se elijan y acepten, el trato aparece aquí.</p>
          <Link href="/tablon" className="h-11 px-space-lg rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center gap-2"><Icono nombre="dashboard" tam={18} /> Ir al Tablón</Link>
        </div>
      )}

      {grupos.map(([titulo, lista]) => lista.length > 0 && (
        <section key={titulo} className="flex flex-col gap-space-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{titulo} <span className="font-metric-mono text-label-md text-on-surface-variant">({lista.length})</span></h2>
          {lista.map((t) => {
            const est = ESTADOS_TRATO[t.estado];
            const otro = t.miRol === 'prestamista' ? t.prestatario : t.prestamista;
            const falta = pendiente(t, yo);
            return (
              <Link key={t.id} href={`/tratos/${t.id}`} className="bg-surface-container hover:bg-surface-container-high rounded-xl p-space-md flex flex-col gap-1 shadow-md">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-headline-sm text-headline-sm text-on-surface">{bs(t.monto)} <span className="font-label-md text-label-md text-on-surface-variant">· {t.miRol === 'prestamista' ? 'prestas a' : 'recibes de'} {corta(otro)}</span></span>
                  <span className={`shrink-0 font-label-sm text-label-sm px-2.5 py-1 rounded-full ${est.color}`}>{est.texto}</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Trato {t.id} · {t.cuotas} cuota{t.cuotas === 1 ? '' : 's'}{t.vence ? ` · vence ${dia(t.vence)}` : ''}</span>
                {falta && <span className="font-label-md text-label-md text-tertiary flex items-center gap-1"><Icono nombre="notification_important" tam={16} /> {falta}</span>}
              </Link>
            );
          })}
        </section>
      ))}

      {mias.length > 0 && (
        <section className="flex flex-col gap-space-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Mis publicaciones abiertas <span className="font-metric-mono text-label-md text-on-surface-variant">({mias.length})</span></h2>
          {mias.map((p) => (
            <Link key={p.id} href={`/tablon/${p.id}`} className="bg-surface-container hover:bg-surface-container-high rounded-xl p-space-md flex items-center justify-between gap-2">
              <span className="font-label-lg text-label-lg text-on-surface">{p.tipo === 'oferta' ? 'Ofrezco' : 'Necesito'} {bs(p.monto)} · {p.plazoDias} días</span>
              <span className="font-label-sm text-label-sm text-primary font-semibold">{p.nInteresados} interesado{p.nInteresados === 1 ? '' : 's'}</span>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
