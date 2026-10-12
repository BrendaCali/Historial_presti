'use client';

import { useEffect, useRef, useState } from 'react';
import { useAval } from '../../AvalProvider';
import Icono from './Icono';

const AVISO_SEGUNDOS = 60;

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Diseño de sesión (Mera): mientras está abierta se firma sin pedir la huella; se bloquea sola por inactividad.
// Este chip la hace visible: cuenta regresiva, aviso un minuto antes y botones para bloquear o mantenerla.
export default function ChipSesion() {
  const { fase, bloqueaEn, bloquear, tocar, avisar } = useAval();
  const [resta, setResta] = useState(null);
  const avisado = useRef(false);

  useEffect(() => {
    if (fase !== 'in' || !bloqueaEn) { setResta(null); return; }
    const calcular = () => Math.max(0, Math.round((bloqueaEn - Date.now()) / 1000));
    setResta(calcular());
    const id = setInterval(() => {
      const s = calcular();
      setResta(s);
      if (s > AVISO_SEGUNDOS) avisado.current = false;
      else if (s > 0 && !avisado.current) {
        avisado.current = true;
        avisar('info', 'Tu sesión se bloquea en 1 minuto. Toca el reloj de arriba para mantenerla.');
      }
    }, 1000);
    return () => clearInterval(id);
  }, [fase, bloqueaEn, avisar]);

  if (fase !== 'in' || resta === null) return null;
  const pronto = resta <= AVISO_SEGUNDOS;

  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={tocar} title="Mantener la sesión abierta"
        className={`h-8 px-2 rounded-full flex items-center gap-1 font-metric-mono text-label-sm transition-colors ${pronto ? 'bg-tertiary/25 text-tertiary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}>
        <Icono nombre={pronto ? 'hourglass_bottom' : 'lock_open'} tam={14} />
        <span>{mmss(resta)}</span>
      </button>
      <button type="button" onClick={() => bloquear('Sesión bloqueada. Usa tu huella para continuar.')} aria-label="Bloquear sesión ahora" title="Bloquear ahora"
        className="h-8 w-8 rounded-full flex items-center justify-center bg-surface-container-high text-on-surface-variant hover:text-error">
        <Icono nombre="lock" tam={16} />
      </button>
    </div>
  );
}
