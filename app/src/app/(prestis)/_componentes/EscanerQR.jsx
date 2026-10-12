'use client';

import jsQR from 'jsqr';
import { useEffect, useRef, useState } from 'react';
import Icono from './Icono';

// Escanea con la cámara el código QR de la otra persona. Funciona en cualquier navegador (decodifica los cuadros con jsQR).
export default function EscanerQR({ onCodigo, onCerrar }) {
  const video = useRef(null);
  const lienzo = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let stream;
    let raf;
    let activo = true;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (!activo) { stream.getTracks().forEach((t) => t.stop()); return; }
        video.current.srcObject = stream;
        await video.current.play();
        const tick = () => {
          const v = video.current;
          if (v && v.videoWidth) {
            const c = lienzo.current;
            c.width = v.videoWidth;
            c.height = v.videoHeight;
            const ctx = c.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(v, 0, 0);
            const img = ctx.getImageData(0, 0, c.width, c.height);
            const r = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
            if (r?.data) { onCodigo(r.data); return; }
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setError('No pudimos abrir la cámara. Revisa el permiso del navegador, o pega el código a mano.');
      }
    })();
    return () => { activo = false; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, [onCodigo]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={onCerrar}>
      <div role="dialog" aria-modal="true" aria-label="Escanear código" onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-surface-container rounded-2xl p-space-md flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Escanea su código</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="w-9 h-9 rounded-full hover:bg-surface-container-high flex items-center justify-center"><Icono nombre="close" tam={20} /></button>
        </div>
        <div className="relative aspect-square rounded-xl overflow-hidden bg-black">
          <video ref={video} playsInline muted className="w-full h-full object-cover" />
          <canvas ref={lienzo} className="hidden" />
          <div className="absolute inset-8 border-2 border-primary/80 rounded-xl pointer-events-none" />
        </div>
        {error ? <p role="alert" className="text-error font-body-sm text-body-sm">{error}</p> : <p className="font-body-sm text-body-sm text-on-surface-variant">Apunta a la pantalla de la otra persona (“Mi código”). Cambia cada 30 segundos.</p>}
      </div>
    </div>
  );
}
