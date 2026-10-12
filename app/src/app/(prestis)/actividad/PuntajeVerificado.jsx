'use client';

import { useEffect, useState } from 'react';
import { createIndexerClient } from '../../../vendor/aval-sdk/index.js';
import { useAval } from '../../AvalProvider';
import Icono from '../_componentes/Icono';

// El indexador (Envio HyperIndex, de Alan) calcula el puntaje verificado del servicio: solo cuenta a quienes de verdad
// le pagaron, descarta autopagos y exige varias personas distintas. Aquí no le creemos: el SDK RECALCULA el puntaje
// con las reseñas y pagos en bruto y lo compara con lo que guardó el indexador.
const indexer = createIndexerClient({ url: '/api/indexador' });

const pct = (v) => (v == null ? '—' : `${Math.round(v * 100)}%`);

export default function PuntajeVerificado() {
  const { datos, direccion, usd } = useAval();
  const [estado, setEstado] = useState({ cargando: true });
  const agentId = datos?.agente?.service?.agentId;

  useEffect(() => {
    if (agentId == null || !direccion) return undefined;
    let vivo = true;
    (async () => {
      try {
        const [comprobacion, pagos] = await Promise.all([indexer.verifyAgentScore(BigInt(agentId)), indexer.payments(direccion, 5)]);
        if (vivo) setEstado({ comprobacion, pagos });
      } catch (e) {
        if (vivo) setEstado(/no está configurado/i.test(e.message) ? { oculto: true } : { error: e.message });
      }
    })();
    return () => { vivo = false; };
  }, [agentId, direccion, datos?.at]);

  const { comprobacion: c, pagos, error, cargando, oculto } = estado;
  if (oculto) return null; // sin INDEXER_URL no se muestra la tarjeta
  const s = c?.stored;

  return (
    <section className="bg-surface-container rounded-xl p-space-md shadow-md flex flex-col gap-space-sm">
      <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs"><Icono nombre="query_stats" tam={20} className="text-primary" /> Puntaje verificado (indexador de Envio)</h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        ERC-8004 deja reseñar a cualquiera. El indexador de Aval calcula el puntaje contando <b>solo a quienes pagaron</b>, descartando autopagos, y el SDK lo <b>recalcula con los datos en bruto</b> para comprobarlo.
      </p>
      {cargando && !error && <span className="font-body-sm text-body-sm text-on-surface-variant">Consultando el indexador…</span>}
      {error && <p className="font-body-sm text-body-sm text-on-surface-variant">El indexador no está disponible ahora ({error}). El puntaje en la cadena de arriba sigue siendo válido.</p>}
      {!cargando && !error && !s && <span className="font-body-sm text-body-sm text-on-surface-variant">Este servicio todavía no tiene reseñas indexadas.</span>}
      {s && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-label-sm text-label-sm px-2.5 py-1 rounded-full font-semibold ${s.status === 'Verified' ? 'bg-primary text-on-primary' : 'bg-tertiary/25 text-tertiary'}`}>
              {s.status === 'Verified' ? 'Verificado' : `Provisional (menos de ${s.minHumans} personas)`}
            </span>
            <span className={`font-label-sm text-label-sm px-2.5 py-1 rounded-full ${c.matches ? 'bg-primary-container/20 text-primary' : 'bg-error-container text-on-error-container'}`}>
              {c.matches ? '✓ El recálculo local coincide con el indexador' : `✗ No coincide: ${c.differences.join(', ')}`}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm text-center">
            {[
              ['Puntaje verificado', s.verifiedAverage == null ? '—' : s.verifiedAverage.toFixed(0)],
              ['Sin filtros (ERC-8004)', s.rawAverage == null ? '—' : s.rawAverage.toFixed(0)],
              ['Personas verificadas', s.verifiedHumans],
              ['Concentración', pct(s.topClientShare)],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface-container-low rounded-lg py-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant block">{k}</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">{v}</span>
              </div>
            ))}
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Reseñas descartadas: {s.excludedNotPaid} sin pago · {s.excludedBelowMinPaid} bajo el mínimo · {s.excludedRelated} autopagos. De {s.totalFeedbackCount} en total.
          </span>
        </>
      )}
      {pagos?.length > 0 && (
        <div className="flex flex-col gap-1 pt-space-xs">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Tus pagos según el indexador</span>
          {pagos.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 bg-surface-container-low rounded-lg p-space-sm font-metric-mono text-label-sm">
              <span className="text-on-surface-variant">Permiso #{String(p.permitId)} · {p.approvedByUser ? 'con huella' : 'sin huella'} · {new Date(Number(p.timestamp) * 1000).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}</span>
              <span className="text-primary">{usd(p.amount)} tUSD</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
