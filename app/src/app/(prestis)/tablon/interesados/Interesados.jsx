'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Icono from '../../_componentes/Icono';

const CANDIDATOS = [
  {
    id: 'jose', nombre: 'José Ramírez', foto: '/img/jose-ramirez.jpg', insignia: '🤝 Cumplido',
    claseInsignia: 'bg-surface-container-highest text-secondary',
    puntos: '740 pts', detalle: '4 personas distintas', puntualidad: '92%', colorPuntualidad: 'text-tertiary',
    etiquetas: [
      { icono: 'fingerprint', texto: 'Verificado con Carnet y Huella', clase: 'text-primary' },
      { icono: 'check_circle', texto: '0 disputas', clase: 'text-on-surface-variant font-metric-mono', claseIcono: 'text-tertiary' },
    ],
  },
  {
    id: 'maria', nombre: 'María Quispe', foto: '/img/maria-quispe.jpg', insignia: '⭐ Muy cumplida',
    claseInsignia: 'bg-primary-container/20 text-primary', destacado: true,
    puntos: '890 pts', detalle: '12 tratos cumplidos', puntualidad: '98%', colorPuntualidad: 'text-primary',
    etiquetas: [
      { icono: 'shield', texto: 'Máxima Confianza Comunal', clase: 'text-primary' },
      { icono: 'verified', texto: '0 atrasos históricos', clase: 'text-tertiary font-metric-mono' },
    ],
  },
];

const COMPARATIVA = [
  { metrica: 'Puntaje Monad', jose: '740 pts', maria: '890 pts ⭐' },
  { metrica: '% Puntualidad', jose: '92%', maria: '98%', barras: [92, 98] },
  { metrica: 'Total Devuelto', jose: 'Bs 1,000–5,000', maria: 'Bs 10,000–20,000', texto: true },
  { metrica: 'Historial Atrasos', jose: '1 leve (<48h)', maria: '0 impecable', mariaClase: 'text-tertiary' },
  { metrica: 'Círculos de aval', jose: 'Mercado Lanza', maria: 'Feria 16 de Julio', texto: true },
];

export default function Interesados() {
  const [aviso, setAviso] = useState(null);
  const comparadorRef = useRef(null);
  const temporizador = useRef(null);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  const avisar = (mensaje, icono = 'check_circle') => {
    clearTimeout(temporizador.current);
    setAviso({ mensaje, icono });
    temporizador.current = setTimeout(() => setAviso(null), 2800);
  };

  return (
    <>
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">3 Personas interesadas</h2>
            <span className="w-5 h-5 rounded-full bg-primary text-on-primary font-metric-mono text-label-sm flex items-center justify-center font-bold">3</span>
          </div>
          <button type="button" onClick={() => comparadorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="px-space-sm py-1.5 rounded-full bg-surface-container-high text-primary hover:bg-surface-bright transition-colors font-metric-mono text-label-sm flex items-center gap-1">
            <Icono nombre="compare_arrows" tam={15} />
            Comparar top 2
          </button>
        </div>

        {CANDIDATOS.map((c) => (
          <div key={c.nombre} className="bg-surface-container rounded-xl p-space-md shadow-md flex flex-col gap-space-sm relative overflow-hidden">
            {c.destacado && <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-primary/15 blur-xl pointer-events-none" />}
            <div className="flex items-start justify-between gap-space-xs">
              <div className="flex items-center gap-space-sm min-w-0">
                <div className="w-11 h-11 rounded-full bg-surface-container-high overflow-hidden shrink-0">
                  <img src={c.foto} alt={c.nombre} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">{c.nombre}</span>
                    <span className={`px-space-xs py-0.5 rounded-full font-label-sm text-label-sm ${c.claseInsignia}`}>{c.insignia}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-metric-mono text-metric-mono text-primary font-bold">{c.puntos}</span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant" />
                    <span className="font-metric-mono text-label-sm text-on-surface-variant">{c.detalle}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className={`font-metric-mono text-metric-mono font-bold ${c.colorPuntualidad}`}>{c.puntualidad}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">a tiempo</span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs flex-wrap">
              {c.etiquetas.map((e) => (
                <span key={e.texto} className={`inline-flex items-center gap-1 px-space-xs py-1 rounded bg-surface-container-lowest font-label-sm text-label-sm ${e.clase}`}>
                  <Icono nombre={e.icono} tam={14} className={e.claseIcono} /> {e.texto}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-space-sm pt-space-xs">
              <button type="button" onClick={() => avisar(`Seleccionaste a ${c.nombre} para coordinar firma`, 'fingerprint')}
                className="flex-1 h-11 rounded-lg bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
                <Icono nombre="how_to_reg" tam={18} />
                Elegir para trato
              </button>
              <Link href={`/perfil/${c.id}`} aria-label={`Ver perfil de ${c.nombre}`}
                className="w-11 h-11 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface flex items-center justify-center shrink-0 transition-colors">
                <Icono nombre="visibility" tam={20} />
              </Link>
            </div>
          </div>
        ))}

        <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm opacity-90">
          <div className="flex items-start justify-between gap-space-xs">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-11 h-11 rounded-full bg-surface-container-high overflow-hidden shrink-0">
                <img src="/img/carlos-v.jpg" alt="Carlos V." className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">Carlos V.</span>
                  <span className="px-space-xs py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">🌱 Nuevo</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-metric-mono text-metric-mono text-secondary-fixed-dim font-bold">520 pts</span>
                  <span className="w-1 h-1 rounded-full bg-outline-variant" />
                  <span className="font-metric-mono text-label-sm text-on-surface-variant">1 trato cerrado</span>
                </div>
              </div>
            </div>
            <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Perfil inicial</span>
          </div>
          <div className="flex items-center justify-between pt-space-xs">
            <span className="font-body-sm text-body-sm text-on-surface-variant">Requiere aval social adicional</span>
            <Link href="/perfil/carlos"
              className="h-9 px-space-sm rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md flex items-center gap-1.5 transition-colors">
              <span>Evaluar</span>
              <Icono nombre="chevron_right" tam={16} />
            </Link>
          </div>
        </div>
      </div>

      <div ref={comparadorRef} className="bg-surface-container rounded-xl p-space-md shadow-lg flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Icono nombre="balance" tam={18} />
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight">Comparativa directa</h3>
              <span className="font-metric-mono text-label-sm text-on-surface-variant">José Ramírez vs María Quispe</span>
            </div>
          </div>
          <button type="button" onClick={() => avisar('Qwen: María Quispe presenta un 6% más puntualidad histórica', 'psychology')}
            className="text-primary hover:text-primary-fixed font-metric-mono text-label-sm flex items-center gap-1">
            <Icono nombre="auto_awesome" tam={15} />
            Analizar
          </button>
        </div>

        <div className="bg-surface-container-low rounded-lg overflow-hidden flex flex-col">
          <div className="grid grid-cols-3 bg-surface-container-high/60 p-space-sm text-center font-metric-mono text-label-sm text-on-surface-variant">
            <span className="text-left">Métrica</span>
            <span className="text-on-surface">José R.</span>
            <span className="text-primary font-bold">María Q.</span>
          </div>
          {COMPARATIVA.map((fila, i) => {
            const fuente = fila.texto ? 'font-body-sm text-body-sm' : 'font-metric-mono text-metric-mono';
            return (
              <div key={fila.metrica} className={`grid grid-cols-3 p-space-sm items-center text-center ${i % 2 ? 'bg-surface-container-high/20' : ''}`}>
                <span className="text-left text-on-surface-variant font-label-sm text-label-sm">{fila.metrica}</span>
                <Celda valor={fila.jose} barra={fila.barras?.[0]} clase={`${fuente} text-on-surface`} colorBarra="bg-secondary" />
                <Celda valor={fila.maria} barra={fila.barras?.[1]} colorBarra="bg-primary"
                  clase={fila.texto ? `${fuente} text-on-surface` : `${fuente} font-bold ${fila.mariaClase ?? 'text-primary'}`} />
              </div>
            );
          })}
        </div>

        <div className="rounded-lg p-space-sm bg-surface-container-high flex items-start gap-space-sm">
          <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 mt-0.5">
            <Icono nombre="neurology" tam={16} relleno />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-metric-mono text-label-sm text-primary font-bold uppercase tracking-wider">Agente Qwen Audit</span>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
            <p className="font-body-sm text-body-sm text-on-surface mt-0.5">
              Sin anillos detectados onchain — Veredicto Limpio. Ninguno presenta transacciones circulares simuladas ni colusión de reputación.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-space-sm pt-space-xs">
        <button type="button" onClick={() => avisar('Canal P256 establecido con María Quispe', 'shield_lock')}
          className="w-full h-13 py-3 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-space-sm shadow-md transition-transform active:scale-[0.98]">
          <Icono nombre="lock" tam={20} />
          <span>Abrir Chat Privado de Coordinación (Offchain P256)</span>
        </button>
        <button type="button" onClick={() => avisar('Generando código QR para encuentro seguro', 'qr_code_2')}
          className="w-full h-12 rounded-xl bg-surface-container-high hover:bg-surface-bright text-primary font-label-lg text-label-lg flex items-center justify-center gap-space-sm transition-colors">
          <Icono nombre="handshake" tam={20} />
          <span>Acordar encuentro presencial</span>
        </button>
      </div>

      <div role="status" aria-live="polite"
        className={`fixed bottom-6 inset-x-4 mx-auto max-w-[calc(28rem-2rem)] bg-surface-container-highest text-on-surface p-space-md rounded-xl shadow-2xl flex items-center justify-between gap-space-sm transition-transform duration-300 pointer-events-none z-50 ${aviso ? 'translate-y-0' : 'translate-y-32'}`}>
        <div className="flex items-center gap-space-sm">
          <Icono nombre={aviso?.icono ?? 'check_circle'} tam={22} className="text-primary" />
          <span className="font-body-md text-body-md text-on-surface font-medium">{aviso?.mensaje}</span>
        </div>
        <span className="font-metric-mono text-label-sm text-secondary uppercase shrink-0">Cifrado P256</span>
      </div>
    </>
  );
}

function Celda({ valor, barra, clase, colorBarra }) {
  if (barra == null) return <span className={clase}>{valor}</span>;
  return (
    <div className="flex flex-col items-center">
      <span className={clase}>{valor}</span>
      <div className="w-12 h-1.5 bg-surface-container-highest rounded-full overflow-hidden mt-1">
        <div className={`h-full ${colorBarra}`} style={{ width: `${barra}%` }} />
      </div>
    </div>
  );
}
