'use client';

import { useEffect, useState } from 'react';
import Icono from '../_componentes/Icono';

const CICLO = 60;

// Código de demostración: todavía no hay TOTP real derivado de la llave P256.
const nuevoCodigo = () => [
  Math.floor(100 + Math.random() * 900),
  Math.floor(100 + Math.random() * 900),
];

// Módulos decorativos del QR, tal como vienen del diseño de Stitch: [x, y, clase].
const P = 'fill-primary', N = 'fill-on-surface', P8 = 'fill-primary/80', P6 = 'fill-primary/60';
const MODULOS = [
  [64, 12, N], [76, 12, P8], [100, 12, N], [112, 12, N], [124, 12, P],
  [64, 24, P], [88, 24, N], [112, 24, P6], [124, 24, N],
  [64, 36, N], [76, 36, N], [100, 36, P], [124, 36, N],
  [12, 64, P], [24, 64, N], [36, 64, N], [48, 64, P8], [144, 64, N], [156, 64, P], [180, 64, N],
  [12, 76, N], [36, 76, P], [48, 76, N], [144, 76, P], [168, 76, N],
  [24, 88, P], [48, 88, P6], [156, 88, N], [180, 88, P],
  [64, 144, N], [76, 144, P], [100, 144, N], [124, 144, P], [144, 144, N],
  [64, 156, P], [88, 156, N], [112, 156, P8], [156, 156, N],
  [76, 168, N], [100, 168, P], [124, 168, N], [144, 168, P], [180, 168, N],
  [64, 180, N], [88, 180, P], [112, 180, N], [168, 180, P8],
];
const ESQUINAS = [[10, 10], [144, 10], [10, 144]];

export default function CodigoDobleFirma() {
  const [codigo, setCodigo] = useState([784, 291]);
  const [restante, setRestante] = useState(42);
  const [girando, setGirando] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setRestante((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (restante > 0) return;
    setCodigo(nuevoCodigo());
    setRestante(CICLO);
  }, [restante]);

  useEffect(() => {
    if (!girando) return;
    const id = setTimeout(() => setGirando(false), 400);
    return () => clearTimeout(id);
  }, [girando]);

  const regenerar = () => {
    setGirando(true);
    setCodigo(nuevoCodigo());
    setRestante(CICLO);
  };

  const avance = ((CICLO - restante) / CICLO) * 100;

  return (
    <div className="relative w-full">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-44 bg-linear-to-b from-primary/20 via-primary-container/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="flex flex-col items-center text-center mt-space-sm mb-space-md">
        <div className="inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container-high text-primary mb-space-xs shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
          <span className="font-metric-mono text-label-sm uppercase tracking-wider">Sesión Monad P256 Activa</span>
        </div>
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Código Dinámico de Doble Firma</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mt-space-xs">Tu contraparte lo escanea o ingresa para co-firmar en Monad</p>
      </div>

      <div className="relative w-full rounded-xl bg-surface-container-low shadow-xl p-space-md flex flex-col items-center overflow-hidden">
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-primary/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-primary/10 rounded-full blur-xl pointer-events-none" />

        <div className="w-full flex items-center justify-between gap-space-xs bg-surface-container px-space-sm py-space-xs rounded-lg mb-space-md">
          <div className="flex items-center gap-space-xs min-w-0">
            <div className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 text-primary">
              <Icono nombre="account_circle" tam={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md text-on-surface truncate">José R.</span>
              <span className="font-metric-mono text-label-sm text-on-surface-variant">CI: ••••458 LP</span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 bg-surface-container-high px-2 py-1 rounded-full shrink-0">
            <span className="font-label-sm text-label-sm text-primary">🤝 Cumplido</span>
            <span className="font-metric-mono text-label-sm text-on-surface-variant">(740 pts)</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-full py-space-xs mb-space-sm">
          <span className="font-label-sm text-label-sm text-on-surface-variant tracking-widest uppercase mb-1">Código Temporal Seguro</span>
          <div className="flex items-center justify-center gap-space-sm" aria-live="polite">
            <span className="font-display-score-mobile text-display-score-mobile text-primary font-bold tracking-wider">{codigo[0]}</span>
            <span className="font-display-score-mobile text-display-score-mobile text-outline-variant font-light">·</span>
            <span className="font-display-score-mobile text-display-score-mobile text-primary font-bold tracking-wider">{codigo[1]}</span>
          </div>
          <div className="flex items-center gap-space-xs mt-space-xs bg-surface-container-high px-space-sm py-1 rounded-full">
            <svg className="w-4 h-4 -rotate-90" viewBox="0 0 36 36">
              <path className="text-surface-variant stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="4" />
              <path className="text-primary stroke-current transition-all duration-1000 ease-linear" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" strokeDasharray="100, 100" strokeDashoffset={avance.toFixed(1)} strokeLinecap="round" strokeWidth="4" />
            </svg>
            <span className="font-metric-mono text-label-sm text-on-surface-variant">
              <span className="text-primary font-semibold">{restante}</span>s restantes
            </span>
          </div>
        </div>

        <div className="relative p-space-sm bg-surface-container-lowest rounded-xl shadow-inner flex items-center justify-center mb-space-md">
          <div className="absolute inset-0 bg-primary/5 rounded-xl blur-md pointer-events-none" />
          <div className="relative w-52 h-52 flex items-center justify-center">
            <svg className="w-full h-full" fill="none" viewBox="0 0 200 200" role="img" aria-label="Código QR de doble firma">
              {ESQUINAS.map(([x, y]) => (
                <g key={`${x}-${y}`}>
                  <rect className="fill-surface-container" x={x} y={y} width="46" height="46" rx="8" />
                  <rect className="fill-surface-container-lowest" x={x + 8} y={y + 8} width="30" height="30" rx="4" />
                  <rect className="fill-primary" x={x + 15} y={y + 15} width="16" height="16" rx="2" />
                </g>
              ))}
              {MODULOS.map(([x, y, clase]) => (
                <rect key={`${x}-${y}`} className={clase} x={x} y={y} width="7" height="7" rx="1.5" />
              ))}
              <rect className="fill-surface-container-lowest" x="72" y="72" width="56" height="56" rx="14" />
              <rect className="fill-secondary-container" x="76" y="76" width="48" height="48" rx="10" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Icono nombre="fingerprint" tam={22} relleno className="text-primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full bg-surface-container rounded-lg p-space-sm flex items-start gap-space-xs">
          <Icono nombre="verified_user" tam={18} className="text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col min-w-0">
            <span className="font-label-md text-label-md text-on-surface font-semibold">1 solo uso · Nonce P256 criptográfico</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight mt-0.5">Clave derivada en hardware de tu huella dactilar (PRF Mera).</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-space-xs px-space-xs py-space-sm mt-space-xs">
        <Icono nombre="lock_reset" tam={16} className="text-secondary shrink-0" />
        <p className="font-body-sm text-body-sm text-secondary leading-snug">
          Este código muere en cuanto se confirma el trato onchain. Nadie puede reutilizarlo.
        </p>
      </div>

      <div className="flex flex-col gap-space-sm w-full mt-space-md">
        <button type="button" className="w-full h-14 bg-primary text-on-primary rounded-xl font-label-lg text-label-lg flex items-center justify-between px-space-md shadow-lg active:opacity-90 transition-transform active:scale-[0.99]">
          <div className="flex items-center gap-space-sm">
            <Icono nombre="qr_code_scanner" tam={24} />
            <span>Escanear QR de otra persona</span>
          </div>
          <Icono nombre="arrow_forward" tam={20} />
        </button>
        <button type="button" onClick={regenerar}
          className="w-full h-12 bg-surface-container-high hover:bg-surface-variant text-primary rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-xs transition-colors">
          <Icono nombre="refresh" tam={20} className={`transition-transform duration-300 ${girando ? 'rotate-180' : ''}`} />
          <span>Regenerar código ahora</span>
        </button>
      </div>
    </div>
  );
}
