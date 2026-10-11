import Encabezado from '../_componentes/Encabezado';
import NavInferior from '../_componentes/NavInferior';
import Icono from '../_componentes/Icono';
import Publicaciones from './Publicaciones';

export const metadata = { title: 'Tablón · Preste' };

export default function Tablon() {
  return (
    <>
      <Encabezado titulo="Tablón" />
      <main className="flex flex-col relative w-full pt-16 pb-20 md:pb-8">
        <div className="flex flex-col w-full mx-auto max-w-5xl px-margin pt-space-sm pb-6 space-y-4">
          <div className="relative overflow-hidden rounded-xl bg-surface-container p-space-md shadow-lg shadow-surface-container-lowest/60">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between gap-space-sm relative z-10">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-metric-mono text-label-sm text-primary uppercase tracking-widest">Red P2P Monad Activa</span>
                </div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">Tu palabra ahora tiene historial.</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Acuerdos entre personas con honor digital y respaldo en cadena.</p>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-full bg-surface-container-high text-primary shrink-0 shadow-inner">
                <Icono nombre="shield_with_heart" tam={24} />
              </div>
            </div>
          </div>

          <Publicaciones />

          <div className="bg-surface-container-low rounded-xl p-space-md mt-2 flex items-start gap-3 shadow-inner">
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 text-primary">
              <Icono nombre="info" tam={18} />
            </div>
            <div className="space-y-1">
              <span className="font-label-sm text-label-sm uppercase text-secondary font-bold tracking-wider block">Garante Protocol • Monad Network</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Preste no intermedia dinero ni es banco. El dinero se entrega en persona cara a cara; el protocolo registra la doble firma inmutable en Monad.
              </p>
            </div>
          </div>
        </div>
      </main>
      <NavInferior />
    </>
  );
}
