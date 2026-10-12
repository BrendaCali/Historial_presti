'use client';

import QRCode from 'qrcode';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAval } from '../../AvalProvider';
import Icono from '../_componentes/Icono';

const CICLO_MS = 30_000;

// Código QR de calificación. Lo firma tu cuenta (Mera, sin ventanas) y CAMBIA cada 30 segundos: así quien te califica
// tiene que estar frente a ti en ese momento, y un código capturado antes no sirve. Cada código se usa una sola vez.
export default function MiCodigo() {
  const { codigoQR, fase, direccion } = useAval();
  const [imagen, setImagen] = useState('');
  const [texto, setTexto] = useState('');
  const [resta, setResta] = useState(CICLO_MS);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);
  const inicio = useRef(0);

  const renovar = useCallback(async () => {
    try {
      const t = await codigoQR();
      setTexto(t);
      setImagen(await QRCode.toDataURL(t, { errorCorrectionLevel: 'L', margin: 1, width: 360, color: { dark: '#0b0f0d', light: '#ffffff' } }));
      inicio.current = Date.now();
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [codigoQR]);

  useEffect(() => {
    if (fase !== 'in') return undefined;
    renovar();
    const id = setInterval(() => {
      const gastado = Date.now() - inicio.current;
      setResta(Math.max(0, CICLO_MS - gastado));
      if (gastado >= CICLO_MS) renovar();
    }, 250);
    return () => clearInterval(id);
  }, [fase, renovar]);

  const copiar = async () => {
    try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* sin permiso de portapapeles */ }
  };

  return (
    <>
      <section className="bg-surface-container rounded-xl p-space-lg shadow-lg flex flex-col items-center gap-space-sm text-center">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Muéstraselo a quien te va a calificar</h2>
        <div className="bg-white rounded-xl p-3">
          {imagen ? <img src={imagen} alt="Código QR de calificación, cambia cada 30 segundos" className="w-64 h-64 sm:w-72 sm:h-72" /> : <div className="w-64 h-64 flex items-center justify-center text-black/60">Generando…</div>}
        </div>
        <div className="w-full max-w-xs h-2 bg-surface-container-high rounded-full overflow-hidden" aria-label="Tiempo hasta que cambie el código">
          <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${(resta / CICLO_MS) * 100}%` }} />
        </div>
        <span className="font-metric-mono text-label-md text-secondary">Cambia en {Math.ceil(resta / 1000)} s</span>
        {error && <p role="alert" className="text-error font-body-sm text-body-sm">{error}</p>}
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
          La otra persona abre su trato, toca <b>Escanear su código</b> y apunta a esta pantalla. El código es tuyo (lo firma tu cuenta), dura segundos y se usa una sola vez.
        </p>
      </section>

      <section className="bg-surface-container rounded-xl p-space-md flex flex-col gap-space-sm">
        <h3 className="font-label-lg text-label-lg text-on-surface flex items-center gap-space-xs"><Icono nombre="content_copy" tam={18} className="text-primary" /> ¿La otra persona no puede escanear?</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Copia el código y envíaselo; lo pega en su trato. Sigue valiendo solo unos minutos y una vez.</p>
        <button type="button" onClick={copiar} disabled={!texto} className="self-start h-10 px-4 rounded-lg bg-surface-container-high hover:bg-surface-bright text-primary font-label-md text-label-md disabled:opacity-60">{copiado ? '¡Copiado!' : 'Copiar código'}</button>
        <details className="font-label-sm text-label-sm text-on-surface-variant">
          <summary className="cursor-pointer">Ver el código en texto</summary>
          <textarea readOnly aria-label="Código en texto" value={texto} onFocus={(e) => e.target.select()} className="mt-1 w-full h-24 p-2 rounded-lg bg-surface-container-high text-on-surface font-metric-mono text-[11px] break-all" />
        </details>
        <span className="font-label-sm text-label-sm text-on-surface-variant break-all">Tu cuenta: {direccion}</span>
      </section>
    </>
  );
}
