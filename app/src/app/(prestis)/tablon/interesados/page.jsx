import { EncabezadoDetalle } from '../../_componentes/Encabezado';
import Icono from '../../_componentes/Icono';
import Interesados from './Interesados';

export const metadata = { title: 'Detalle del trato · Preste' };

export default function DetalleTrato() {
  return (
    <>
      <EncabezadoDetalle titulo="Detalle Del Trato" volverA="/tablon" />
      <main className="flex flex-col relative w-full pt-16 pb-safe">
        <div className="flex flex-col w-full mx-auto max-w-3xl pt-space-sm pb-10 px-margin gap-space-lg">
          <div className="bg-surface-container rounded-xl p-space-md shadow-lg relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between gap-space-sm mb-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-12 h-12 rounded-full bg-surface-container-high overflow-hidden shrink-0">
                  <img src="/img/alan-meneces.jpg" alt="Alan Meneces" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-headline-sm text-headline-sm text-on-surface truncate">Alan Meneces</span>
                    <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded-full bg-surface-container-highest text-secondary font-label-sm text-label-sm">
                      <Icono nombre="star" tam={13} relleno className="text-primary" /> Muy cumplido
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-metric-mono text-metric-mono text-primary font-bold">860 pts</span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant" />
                    <span className="font-metric-mono text-label-sm text-on-surface-variant uppercase">Monad P256</span>
                  </div>
                </div>
              </div>
              <span className="px-space-sm py-1 rounded-full bg-primary-container/20 text-primary font-metric-mono text-label-sm uppercase tracking-wide shrink-0">Activo</span>
            </div>
            <div className="bg-surface-container-low rounded-lg p-space-md mt-space-xs flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Oferta de Liquidez</span>
              <div className="flex items-baseline justify-between">
                <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">Bs 2,000</span>
                <span className="font-metric-mono text-metric-mono text-on-surface-variant">Plazo estimado: 30d</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Fondo rotativo disponible para comerciantes del mercado o gremiales con reputación activa verificada en Monad.
              </p>
            </div>
          </div>

          <div className="bg-secondary-container/40 rounded-xl p-space-md flex items-start gap-space-sm shadow-md">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary mt-0.5">
              <Icono nombre="verified_user" tam={20} relleno />
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-secondary-fixed font-semibold">Garantía Social de Palabra</span>
              <p className="font-body-sm text-body-sm text-on-surface mt-0.5">
                El préstamo solo queda formalizado cuando ambos firman con su huella en persona mediante su llave de paso.
              </p>
            </div>
          </div>

          <Interesados />
        </div>
      </main>
    </>
  );
}
