'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { bs, fecha } from '../../../../lib/formato';
import Icono from '../../_componentes/Icono';
import { Condiciones, Persona, Reputacion } from '../../_componentes/Tarjetas';
import { useAccion, useVista } from '../../_componentes/useMercado';

// Detalle de una publicación. Quien publicó ve a los interesados con su reputación, los compara y elige con quién cerrar
// el trato. Las demás personas pueden mostrar o quitar su interés.
export default function Detalle({ id }) {
  const router = useRouter();
  const { datos: o, error, recargar } = useVista('ver-publicacion', { id });
  const { ocupado, ejecutar } = useAccion(recargar);

  if (!o) return <p className={`font-body-sm text-body-sm ${error ? 'text-error' : 'text-on-surface-variant'}`}>{error || 'Cargando…'}</p>;

  const estadoTexto = { abierta: 'Abierta', 'en-trato': 'En trato', cerrada: 'Cerrada' }[o.estado];
  return (
    <>
      <Link href="/tablon" className="self-start font-label-md text-label-md text-primary flex items-center gap-1 hover:underline"><Icono nombre="arrow_back" tam={16} /> Volver al Tablón</Link>

      <section className="bg-surface-container rounded-xl p-space-md shadow-lg flex flex-col gap-space-sm">
        <div className="flex items-start justify-between gap-2">
          <Persona addr={o.autor} r={o.reputacion} yo={o.soyAutor} />
          <span className="shrink-0 font-metric-mono text-label-sm uppercase px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">{o.tipo === 'oferta' ? 'Ofrece' : 'Solicita'} · {estadoTexto}</span>
        </div>
        <Condiciones o={o} />
        <span className="font-label-sm text-label-sm text-on-surface-variant">Publicada el {fecha(o.creada)} · {o.nInteresados} interesado{o.nInteresados === 1 ? '' : 's'}</span>
      </section>

      {o.estado === 'en-trato' && o.tratoId && (
        <Link href={`/tratos/${o.tratoId}`} className="h-12 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2">
          <Icono nombre="handshake" tam={20} /> Ir al trato
        </Link>
      )}

      {!o.soyAutor && o.estado === 'abierta' && (
        <button type="button" disabled={!!ocupado} aria-pressed={o.yoInteresado}
          onClick={() => ejecutar('i', o.yoInteresado ? 'quitarInteres' : 'interesar', { id }, o.yoInteresado ? 'Quitaste tu interés.' : 'Mostraste interés. Quien publicó verá tu perfil y puede elegirte.')}
          className={`h-12 rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 disabled:opacity-60 ${o.yoInteresado ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary text-on-primary hover:bg-primary-fixed-dim'}`}>
          <Icono nombre={o.yoInteresado ? 'check' : 'handshake'} tam={20} /> {o.yoInteresado ? 'Ya mostraste interés (tocar para quitarlo)' : 'Me interesa'}
        </button>
      )}

      {o.soyAutor && o.estado === 'abierta' && (
        <section className="bg-surface-container rounded-xl p-space-md flex flex-col gap-space-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs"><Icono nombre="groups" tam={20} className="text-primary" /> Interesados ({o.interesados.length})</h2>
          {o.interesados.length === 0 && <p className="font-body-sm text-body-sm text-on-surface-variant">Todavía nadie. Cuando alguien toque “Me interesa” aparecerá aquí con su reputación.</p>}
          {[...o.interesados].sort((a, b) => (b.reputacion.puntaje ?? 0) - (a.reputacion.puntaje ?? 0)).map((i) => (
            <div key={i.addr} className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-2">
              <Persona addr={i.addr} r={i.reputacion} />
              <div className="grid grid-cols-4 gap-2 text-center">
                {[['Puntaje', i.reputacion.puntaje ?? '—'], ['Pagados', i.reputacion.pagados], ['A tiempo', i.reputacion.pagados ? `${Math.round((i.reputacion.aTiempo / i.reputacion.pagados) * 100)}%` : '—'], ['Personas', i.reputacion.personas]].map(([t, v]) => (
                  <div key={t} className="bg-surface-container-high/60 rounded-lg py-1">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">{t}</span>
                    <span className="font-metric-mono text-label-md text-on-surface">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Link href={`/perfil/${i.addr}`} className="h-10 px-4 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md flex items-center gap-1"><Icono nombre="visibility" tam={18} /> Ver perfil</Link>
                <button type="button" disabled={!!ocupado} onClick={() => ejecutar(`e-${i.addr}`, 'elegir', { id, interesado: i.addr }, 'Trato creado. Esperando que acepte.').then((r) => r && router.push(`/tratos/${r.tratoId}`))}
                  className="flex-1 h-10 rounded-lg bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-md text-label-md font-bold flex items-center justify-center gap-1 disabled:opacity-60">
                  <Icono nombre="how_to_reg" tam={18} /> {ocupado === `e-${i.addr}` ? 'Creando…' : 'Elegir para trato'}
                </button>
              </div>
            </div>
          ))}
          <button type="button" disabled={!!ocupado} onClick={() => ejecutar('c', 'cerrarPublicacion', { id }, 'Publicación cerrada.').then((r) => r && router.push('/tablon'))}
            className="self-start h-10 px-4 rounded-lg bg-surface-container-high hover:bg-error-container text-error font-label-md text-label-md disabled:opacity-60">Cerrar publicación</button>
        </section>
      )}

      {!o.soyAutor && o.estado === 'abierta' && <p className="font-body-sm text-body-sm text-on-surface-variant">Quien publicó compara a las personas interesadas y elige con quién hacer el trato. Aquí verás si te eligió.</p>}
      <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1"><Icono nombre="shield" tam={14} /> Reputación del autor: <Reputacion r={o.reputacion} /></p>
    </>
  );
}
