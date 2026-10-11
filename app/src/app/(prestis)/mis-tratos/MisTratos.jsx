'use client';

import Link from 'next/link';
import { useState } from 'react';
import Icono from '../_componentes/Icono';

// Aún no hay contratos desplegados ni indexer: la lista sale vacía hasta que el protocolo registre tratos.
const PESTANAS = [
  { id: 'activos', texto: 'Activos', icono: 'play_circle', vacio: 'No tienes préstamos activos.' },
  { id: 'vencidos', texto: 'Vencidos', icono: 'schedule', vacio: 'Ningún préstamo vencido. Eso es buena señal.' },
  { id: 'cerrados', texto: 'Cerrados', icono: 'task_alt', vacio: 'Todavía no cerraste ningún trato.' },
];

export default function MisTratos() {
  const [activa, setActiva] = useState('activos');
  const pestana = PESTANAS.find((p) => p.id === activa);

  return (
    <>
      <div role="tablist" aria-label="Estado de los tratos" className="grid grid-cols-3 gap-2 bg-surface-container rounded-xl p-1">
        {PESTANAS.map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={activa === p.id} onClick={() => setActiva(p.id)}
            className={`h-11 rounded-lg font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors ${
              activa === p.id ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}>
            <Icono nombre={p.icono} tam={18} /> {p.texto}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="bg-surface-container rounded-xl p-space-xl text-center flex flex-col items-center gap-space-sm">
        <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
          <Icono nombre="handshake" tam={28} />
        </div>
        <p className="font-headline-sm text-headline-sm text-on-surface">{pestana.vacio}</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
          Cuando elijas a alguien en el Tablón y los dos firmen con su huella, el trato aparece aquí con su estado y su fecha límite.
        </p>
        <Link href="/asistente" className="h-11 px-space-lg rounded-xl bg-surface-container-high hover:bg-surface-bright text-primary font-label-lg text-label-lg font-bold flex items-center gap-2">
          <Icono nombre="smart_toy" tam={18} /> Pagar cuotas con mi asistente
        </Link>
        <Link href="/tablon" className="h-11 px-space-lg rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg font-bold flex items-center gap-2">
          <Icono nombre="dashboard" tam={18} /> Ir al Tablón
        </Link>
      </div>
    </>
  );
}
