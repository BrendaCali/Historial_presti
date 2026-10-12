'use client';

import { useEffect, useState } from 'react';
import { txUrl } from '../../../lib/aval/config';
import { fecha } from '../../../lib/formato';
import { useAval } from '../../AvalProvider';
import Icono from '../_componentes/Icono';

// Avisos en vivo: Alchemy llama a /api/avisos (webhook "Address Activity") cuando tu cuenta recibe o envía tUSD, y aquí
// se ven sin recargar. La app suscribe tu dirección al webhook al crear la cuenta.
export default function AvisosAlchemy() {
  const { direccion } = useAval();
  const [estado, setEstado] = useState({ avisos: null, configurado: true });

  useEffect(() => {
    if (!direccion) return undefined;
    let vivo = true;
    const cargar = () => fetch(`/api/avisos?direccion=${direccion}`, { cache: 'no-store' }).then((r) => r.json()).then((j) => vivo && setEstado({ avisos: j.avisos ?? [], configurado: j.configurado })).catch(() => {});
    cargar();
    const id = setInterval(cargar, 6000);
    return () => { vivo = false; clearInterval(id); };
  }, [direccion]);

  const mio = direccion?.toLowerCase();
  return (
    <section className="bg-surface-container rounded-xl p-space-md shadow-md flex flex-col gap-space-sm">
      <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs"><Icono nombre="notifications_active" tam={20} className="text-primary" /> Avisos en vivo (webhook de Alchemy)</h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant">Alchemy avisa a la app cuando tu cuenta recibe o envía tUSD; la firma de cada aviso se verifica (HMAC-SHA256) antes de guardarlo.</p>
      {estado.avisos === null && <span className="font-body-sm text-body-sm text-on-surface-variant">Consultando…</span>}
      {estado.avisos?.length === 0 && (
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          {estado.configurado ? 'Todavía no llegaron avisos. Mueve tUSD (por ejemplo, un pago del asistente) y aparecerá aquí.' : 'El webhook aún no está conectado en este entorno.'}
        </span>
      )}
      {estado.avisos?.map((a) => (
        <a key={a.id} href={txUrl(a.hash)} target="_blank" rel="noreferrer" className="bg-surface-container-low hover:bg-surface-container-high rounded-lg p-space-sm flex items-center justify-between gap-2">
          <span className="font-label-lg text-label-lg text-on-surface">{a.a === mio ? '↓ Recibiste' : '↑ Enviaste'}</span>
          <span className="font-metric-mono text-label-md text-primary">{Number(a.valor).toFixed(2)} {a.activo}<span className="text-on-surface-variant"> · {fecha(a.t)}</span></span>
        </a>
      ))}
    </section>
  );
}
