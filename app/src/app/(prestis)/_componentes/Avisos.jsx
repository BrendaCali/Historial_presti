'use client';

import { useAval } from '../../AvalProvider';
import Icono from './Icono';

// Aviso flotante (éxito, error o información) para las acciones de las pantallas internas.
export default function Avisos() {
  const { aviso, descartarAviso } = useAval();
  const icono = aviso?.tipo === 'error' ? 'error' : aviso?.tipo === 'ok' ? 'check_circle' : 'info';
  const color = aviso?.tipo === 'error' ? 'text-error' : 'text-primary';
  return (
    <div role="status" aria-live="polite"
      className={`fixed bottom-24 md:bottom-6 inset-x-4 md:left-[calc(16rem+1rem)] md:right-auto mx-auto md:mx-0 max-w-md bg-surface-container-highest text-on-surface p-space-md rounded-xl shadow-2xl flex items-center justify-between gap-space-sm transition-transform duration-300 z-[70] ${aviso ? 'translate-y-0' : 'translate-y-48 pointer-events-none'}`}>
      <div className="flex items-center gap-space-sm min-w-0">
        <Icono nombre={icono} tam={22} className={color} />
        <span className="font-body-md text-body-md font-medium">{aviso?.texto}</span>
      </div>
      <button type="button" onClick={descartarAviso} aria-label="Cerrar aviso" className="shrink-0 text-on-surface-variant hover:text-on-surface">
        <Icono nombre="close" tam={18} />
      </button>
    </div>
  );
}
