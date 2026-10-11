'use client';

import Link from 'next/link';
import { hexToString } from 'viem';
import { addressUrl } from '../../../lib/aval/config';
import { useAval } from '../../AvalProvider';
import Icono from '../_componentes/Icono';

export const etiquetaRef = (ref) => {
  try {
    return hexToString(ref, { size: 32 }).replace(/\0/g, '').trim() || 'sin referencia';
  } catch {
    return 'sin referencia';
  }
};

export default function Aprobaciones() {
  const { datos, pendientes, aprobar, ocupado, usd, modo } = useAval();
  if (!datos) return null;

  return (
    <>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Cuando tu agente quiere pagar más que tu umbral, el pago queda pendiente. Solo se ejecuta si lo apruebas con tu huella: la firma se
        verifica en la cadena (precompile P256 de Monad) y solo sirve para ese pago exacto.
      </p>

      {pendientes.length === 0 ? (
        <div className="bg-surface-container rounded-xl p-space-xl text-center flex flex-col items-center gap-space-sm">
          <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
            <Icono nombre="fingerprint" tam={28} />
          </div>
          <p className="font-headline-sm text-headline-sm text-on-surface">No hay pagos esperando tu huella.</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
            Pídele a tu asistente algo que supere tu umbral y aparecerá aquí.
          </p>
          <Link href="/asistente" className="h-11 px-space-lg rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg font-bold flex items-center gap-2">
            <Icono nombre="smart_toy" tam={18} /> Ir al asistente
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-space-sm">
          {pendientes.map(({ requestId, request }) => (
            <div key={String(requestId)} className="bg-surface-container rounded-xl p-space-md shadow-md flex flex-col gap-space-sm">
              <div className="flex items-center justify-between gap-space-sm">
                <span className="font-headline-sm text-headline-sm text-on-surface">{usd(request.amount)} tUSD</span>
                <span className="font-metric-mono text-label-sm uppercase px-2 py-0.5 rounded-full bg-tertiary/20 text-tertiary">Pendiente #{String(requestId)}</span>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant flex flex-col gap-0.5">
                <span>Concepto: <b className="text-on-surface">{etiquetaRef(request.ref)}</b></span>
                <span>Para: <a className="text-primary hover:underline font-metric-mono" href={addressUrl(request.to)} target="_blank" rel="noreferrer">{request.to.slice(0, 8)}…{request.to.slice(-6)}</a></span>
                <span>Permiso #{String(request.permitId)}</span>
              </div>
              <button type="button" disabled={!!ocupado} onClick={() => aprobar(requestId)}
                className="h-12 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                <Icono nombre="fingerprint" tam={20} />
                {ocupado === `approve-${requestId}` ? 'Esperando tu huella…' : 'Aprobar con mi huella'}
              </button>
              {modo === 'simulated' && <p className="font-label-sm text-label-sm text-on-surface-variant">Sin passkey real: la aprobación usa la clave de software de este navegador.</p>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
