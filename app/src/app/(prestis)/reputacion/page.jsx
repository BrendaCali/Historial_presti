import Encabezado from '../_componentes/Encabezado';
import NavInferior from '../_componentes/NavInferior';
import Icono from '../_componentes/Icono';
import { CabeceraPropia, AtestacionQR } from './Interactivos';

export const metadata = { title: 'Mi Reputación · Preste' };

const RADIO = 66;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
const PUNTAJE = 860;

const DESGLOSE = [
  { factor: 'Puntualidad a tiempo', peso: '45%', valor: '95%', barra: 95, color: 'bg-primary', texto: 'text-primary' },
  { factor: 'Gravedad de atrasos', peso: '25%', valor: '0 días', barra: 100, color: 'bg-primary-fixed', texto: 'text-primary-fixed' },
  { factor: 'Diversidad de personas', peso: '15%', valor: '8 pares', barra: 80, color: 'bg-secondary', texto: 'text-on-surface' },
  { factor: 'Montos devueltos acumulados', peso: '10%', valor: 'Bs 10,000–20,000', barra: 88, color: 'bg-tertiary', texto: 'text-tertiary font-metric-mono' },
  { factor: 'Antigüedad y constancia', peso: '5%', valor: '7 meses', barra: 70, color: 'bg-on-surface-variant', texto: 'text-on-surface' },
];

const HISTORIAL = [
  { id: '#042', persona: 'José R.', monto: 'Bs 500–1,000', tx: '0x4f...91', firmaVerificada: true },
  { id: '#039', persona: 'Carmen T.', monto: 'Bs 100–500', tx: '0x1a...6e' },
];

export default function Reputacion() {
  return (
    <>
      <Encabezado titulo="Reputación" />
      <main className="flex flex-col relative w-full pt-16 pb-20 md:pb-8">
        <div className="flex flex-col w-full mx-auto max-w-3xl px-margin pb-space-xl">
          <CabeceraPropia />

          <div className="w-full rounded-xl bg-secondary-container/40 p-space-sm mt-space-md flex items-center gap-space-sm">
            <Icono nombre="info" tam={18} className="text-primary shrink-0" />
            <p className="font-body-sm text-body-sm text-on-surface">Puntaje y desglose de muestra: todavía no se leen de la cadena. Una cuenta nueva empieza en 🌱 Nuevo, sin historial.</p>
          </div>

          <div className="w-full rounded-xl bg-surface-container p-space-lg mt-space-md shadow-xl relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="w-full flex items-center justify-between mb-space-sm">
              <span className="font-metric-mono text-label-sm text-on-surface-variant uppercase tracking-wider">Puntaje Onchain Monad</span>
              <span className="font-metric-mono text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">+35 pts este mes</span>
            </div>
            <div className="relative w-44 h-44 flex items-center justify-center my-space-xs">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
                <circle className="text-surface-container-high" cx="80" cy="80" r={RADIO} fill="transparent" stroke="currentColor" strokeWidth="12" />
                <circle className="text-primary-container" cx="80" cy="80" r={RADIO} fill="transparent" stroke="currentColor" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={CIRCUNFERENCIA} strokeDashoffset={CIRCUNFERENCIA * (1 - PUNTAJE / 1000)} />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="font-display-score-mobile text-display-score-mobile text-on-surface tracking-tight leading-none">{PUNTAJE}</span>
                <span className="font-metric-mono text-label-sm text-secondary uppercase mt-0.5">de 1000 Pts</span>
              </div>
            </div>
            <div className="w-full grid grid-cols-2 gap-space-xs mt-space-xs pt-space-xs">
              <div className="rounded-lg bg-surface-container-low p-space-sm flex flex-col items-center">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Grado de Confianza</span>
                <span className="font-headline-sm text-headline-sm text-primary">⭐ Muy cumplido</span>
              </div>
              <div className="rounded-lg bg-surface-container-low p-space-sm flex flex-col items-center">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Personas distintas</span>
                <span className="font-headline-sm text-headline-sm text-tertiary">8 personas</span>
              </div>
            </div>
          </div>

          <div className="w-full rounded-xl bg-surface-container p-space-md mt-space-md shadow-xl flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <Icono nombre="analytics" tam={18} className="text-primary" />
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Desglose Ponderado</h3>
              </div>
              <span className="font-metric-mono text-label-sm text-on-surface-variant">Protocolo Garante</span>
            </div>
            <div className="flex flex-col gap-space-sm pt-space-xs">
              {DESGLOSE.map((d) => (
                <div key={d.factor} className="flex flex-col gap-1 bg-surface-container-low p-space-sm rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${d.color}`} />
                      <span className="font-label-lg text-label-lg text-on-surface">{d.factor}</span>
                      <span className="font-metric-mono text-label-sm text-secondary">({d.peso})</span>
                    </div>
                    <span className={`font-headline-sm text-headline-sm ${d.texto}`}>{d.valor}</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${d.color}`} style={{ width: `${d.barra}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full rounded-xl bg-secondary-container/40 p-space-md mt-space-md shadow-md flex items-start gap-space-sm">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0 text-on-primary-container shadow-sm">
              <Icono nombre="verified_user" tam={20} relleno />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="font-headline-sm text-headline-sm text-on-surface">Auditoría ERC-8004</span>
                <span className="font-metric-mono text-label-sm uppercase px-1.5 py-0.5 rounded bg-surface-container-high text-primary">Qwen 3.8 Max Agent</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Sin anillos de colusión ni votos cruzados artificiales detectados en el grafo social Monad.
              </p>
            </div>
          </div>

          <div className="w-full rounded-xl bg-surface-container p-space-md mt-space-md shadow-xl flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <Icono nombre="history" tam={18} className="text-primary" />
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Historial de Préstamos</h3>
              </div>
              <span className="font-metric-mono text-label-sm text-primary uppercase">100% Pagados</span>
            </div>
            <div className="flex flex-col gap-space-sm pt-space-xs">
              {HISTORIAL.map((h) => (
                <div key={h.id} className="flex flex-col gap-1.5 bg-surface-container-low p-space-sm rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-metric-mono text-label-sm px-1.5 py-0.5 rounded bg-surface-container-high text-secondary">{h.id}</span>
                      <span className="font-label-lg text-label-lg text-on-surface truncate">{h.persona}</span>
                    </div>
                    <span className="font-metric-mono text-headline-sm text-primary">{h.monto}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-tertiary">
                      <Icono nombre="check_circle" tam={14} />
                      <span className="font-body-sm text-body-sm">Devuelto a tiempo</span>
                    </div>
                    <span className="font-metric-mono text-label-sm text-on-surface-variant">Tx: {h.tx}</span>
                  </div>
                  {h.firmaVerificada && (
                    <div className="flex items-center gap-1 text-on-surface-variant pt-0.5">
                      <Icono nombre="key" tam={12} className="text-primary" />
                      <span className="font-label-sm text-label-sm">Doble firma verificada onchain Monad</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <AtestacionQR />
        </div>
      </main>
      <NavInferior />
    </>
  );
}
