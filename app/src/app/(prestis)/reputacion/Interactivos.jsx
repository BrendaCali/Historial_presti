'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAval } from '../../AvalProvider';
import Icono from '../_componentes/Icono';

export function BotonCopiar({ direccion, corta }) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const id = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(id);
  }, [copiado]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(direccion);
      setCopiado(true);
    } catch {
      // Sin permiso de portapapeles: no hay nada que mostrar.
    }
  };

  return (
    <button type="button" onClick={copiar} aria-label="Copiar dirección"
      className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-left group">
      <span className="font-metric-mono text-metric-mono text-secondary">{corta}</span>
      <Icono nombre={copiado ? 'check' : 'content_copy'} tam={14} className="text-outline group-hover:text-primary" />
    </button>
  );
}

export function AtestacionQR() {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const alEscape = (e) => e.key === 'Escape' && setAbierto(false);
    window.addEventListener('keydown', alEscape);
    return () => window.removeEventListener('keydown', alEscape);
  }, [abierto]);

  return (
    <>
      <div className="w-full mt-space-lg">
        <button type="button" onClick={() => setAbierto(true)}
          className="w-full h-14 rounded-xl bg-primary hover:bg-primary-fixed text-on-primary font-label-lg text-label-lg flex items-center justify-between px-space-md shadow-lg shadow-primary/20 active:scale-[0.99] transition-all">
          <div className="flex items-center gap-space-sm">
            <Icono nombre="qr_code_2" tam={24} />
            <span className="text-left font-semibold">Generar QR de Atestación Temporal</span>
          </div>
          <div className="flex items-center gap-1 opacity-80">
            <span className="font-metric-mono text-label-sm uppercase">SDK</span>
            <Icono nombre="chevron_right" tam={20} />
          </div>
        </button>
        <p className="text-center font-body-sm text-body-sm text-on-surface-variant mt-2">
          Comparte tu historial con cooperativas y círculos de pasanaku sin exponer llaves privadas.
        </p>
      </div>

      {abierto && (
        <div role="dialog" aria-modal="true" aria-labelledby="titulo-atestacion" onClick={() => setAbierto(false)}
          className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-space-md">
          <div onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-surface-container-high p-space-lg shadow-2xl flex flex-col items-center text-center relative">
            <button type="button" aria-label="Cerrar" onClick={() => setAbierto(false)}
              className="absolute top-space-md right-space-md text-on-surface-variant hover:text-on-surface">
              <Icono nombre="close" />
            </button>
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center mb-space-sm text-primary">
              <Icono nombre="verified" tam={28} />
            </div>
            <h4 id="titulo-atestacion" className="font-headline-sm text-headline-sm text-on-surface mb-1">Atestación Onchain Válida</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">requestAccess SDK · Vence en 10 minutos</p>
            <div className="p-3 bg-on-background rounded-lg shadow-inner flex items-center justify-center mb-space-md">
              <svg className="w-48 h-48" fill="none" viewBox="0 0 100 100" role="img" aria-label="Código QR de atestación">
                <rect fill="#e0e3df" width="100" height="100" />
                <path fill="#003824" d="M10 10h30v30h-30z M15 15h20v20h-20z M20 20h10v10h-10z" />
                <path fill="#003824" d="M60 10h30v30h-30z M65 15h20v20h-20z M70 20h10v10h-10z" />
                <path fill="#003824" d="M10 60h30v30h-30z M15 65h20v20h-20z M20 70h10v10h-10z" />
                <path fill="#003824" d="M48 12h5v5h-5z M52 24h6v6h-6z M46 36h8v8h-8z M12 48h6v6h-6z M26 48h6v6h-6z M38 52h8v8h-8z M48 48h6v6h-6z M64 48h6v6h-6z M78 52h8v8h-8z M50 64h8v8h-8z M62 62h6v6h-6z M76 66h8v8h-8z M52 78h6v6h-6z M64 76h8v8h-8z M80 78h6v6h-6z" />
              </svg>
            </div>
            <div className="flex items-center gap-space-xs text-secondary font-metric-mono text-label-sm bg-surface-container py-1 px-3 rounded-full mb-space-md">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Hash: 0x82f...a19c · Monad Testnet
            </div>
            <button type="button" onClick={() => setAbierto(false)}
              className="w-full h-12 rounded-lg bg-surface-variant hover:bg-surface-bright text-on-surface font-label-lg text-label-lg transition-colors">
              Cerrar y Regresar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Muestra la cuenta con la que se entró (Mera). Sin sesión, invita a entrar con la huella.
export function CabeceraPropia() {
  const { direccion } = useAval();
  return (
    <div className="relative w-full rounded-xl bg-surface-container p-space-md shadow-xl overflow-hidden mt-space-sm">
      <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
      <div className="flex items-start justify-between gap-space-sm relative z-10">
        <div className="flex items-center gap-space-sm min-w-0">
          <div className="relative w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center p-1 shrink-0 shadow-md">
            <img src="/img/logo-condor.png" alt="Emblema Cóndor" className="w-full h-full object-contain drop-shadow" />
            {direccion && (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-on-primary">
                <Icono nombre="verified" tam={11} relleno />
              </span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-headline-sm text-on-surface truncate">{direccion ? 'Tu cuenta' : 'Sin sesión'}</span>
            {direccion ? (
              <BotonCopiar direccion={direccion} corta={`${direccion.slice(0, 6)}…${direccion.slice(-4)}`} />
            ) : (
              <Link href="/" className="font-label-md text-label-md text-primary hover:underline">Entrar con huella</Link>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="font-label-sm text-label-sm uppercase px-2 py-0.5 rounded-full bg-primary-container/20 text-primary flex items-center gap-1 font-semibold">🌱 Nuevo</span>
          <span className="font-metric-mono text-label-sm uppercase px-2 py-0.5 rounded-full bg-surface-container-highest text-secondary-fixed flex items-center gap-1">
            <Icono nombre="badge" tam={11} className="text-tertiary" />
            Carnet 1:1
          </span>
        </div>
      </div>
    </div>
  );
}
