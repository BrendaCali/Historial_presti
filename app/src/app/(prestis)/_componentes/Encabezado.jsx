import Link from 'next/link';
import Icono from './Icono';

const BARRA = 'fixed top-0 inset-x-0 md:left-64 z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_4px_20px_rgba(0,0,0,0.35)]';

function Avatar() {
  return (
    <Link href="/reputacion" aria-label="Mi perfil" className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 hover:bg-primary-fixed-dim transition-colors">
      <Icono nombre="person" tam={18} className="text-on-primary" />
    </Link>
  );
}

export default function Encabezado({ titulo }) {
  return (
    <header className={BARRA}>
      <div className="h-16 px-margin mx-auto max-w-5xl flex items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm min-w-0">
          <img src="/img/logo-condor.png" alt="Garante Protocol" className="h-8 w-auto object-contain shrink-0" />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight truncate">Preste</span>
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="font-metric-mono text-label-sm uppercase bg-surface-container-high text-primary px-space-xs py-0.5 rounded-full tracking-wider">Monad</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-0.5">
                <Icono nombre="fingerprint" tam={12} className="text-primary" />P256
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-space-xs">
          <div className="flex flex-col items-end pr-1">
            <span className="font-headline-sm text-headline-sm font-semibold text-on-surface tracking-tight hidden sm:inline">{titulo}</span>
            <span className="font-label-sm text-label-sm text-secondary truncate max-w-[100px]">Garante Protocol</span>
          </div>
          <Avatar />
        </div>
      </div>
    </header>
  );
}

export function EncabezadoDetalle({ titulo, volverA }) {
  return (
    <header className={BARRA}>
      <div className="h-16 px-space-sm mx-auto max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Link href={volverA} aria-label="Volver" className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high transition-colors">
            <Icono nombre="arrow_back" tam={22} />
          </Link>
          <img src="/img/logo-condor.png" alt="Garante Protocol" className="h-7 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="font-metric-mono text-label-sm text-secondary uppercase tracking-wider">Preste · Monad</span>
            <h1 className="font-headline-sm text-headline-sm text-on-surface leading-tight truncate max-w-[190px]">{titulo}</h1>
          </div>
        </div>
        <div className="flex items-center gap-space-xs">
          <span className="font-metric-mono text-label-sm bg-surface-container-high text-primary px-space-xs py-0.5 rounded-full hidden sm:inline">P256</span>
          <Avatar />
        </div>
      </div>
    </header>
  );
}
