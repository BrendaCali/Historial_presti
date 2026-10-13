'use client';

import Icono from './(prestis)/_componentes/Icono';

// Ventana de confirmación con la huella para acciones que mueven dinero o comprometen al usuario.
// La passkey de Mera es la misma que abrió la cuenta: aquí se pide una firma de WebAuthn sobre esta acción concreta.
export default function ModalHuella({ pendiente, modo, alUsar, alCancelar }) {
  if (!pendiente) return null;
  const { info, trabajando, error } = pendiente;
  return (
    <div role="dialog" aria-modal="true" aria-label="Confirma con tu huella" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-space-md">
      <div className="w-full max-w-sm bg-surface-container rounded-2xl p-space-lg shadow-lg flex flex-col items-center gap-space-sm text-center">
        <span className={`flex items-center justify-center w-20 h-20 rounded-full bg-surface-container-high text-primary ${trabajando ? 'animate-pulse' : ''}`}>
          <Icono nombre="fingerprint" tam={48} />
        </span>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Confirma con tu huella</h2>
        <p className="font-body-md text-body-md text-on-surface">{info.titulo}</p>
        {info.detalle && <p className="font-body-sm text-body-sm text-on-surface-variant">{info.detalle}</p>}
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          Es la misma passkey de Mera con la que entraste. La firma cubre esta acción concreta; nada sale de tu dispositivo.
          {modo === 'simulated' && ' (Modo de prueba: la huella está simulada.)'}
        </p>
        {error && <p role="alert" className="font-label-md text-label-md text-error">{error}</p>}
        <div className="flex gap-space-sm w-full mt-space-xs">
          <button type="button" onClick={alCancelar} disabled={trabajando} className="flex-1 h-12 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-lg text-label-lg disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={alUsar} disabled={trabajando} className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg font-bold disabled:opacity-60">
            {trabajando ? 'Verificando…' : error ? 'Reintentar' : 'Usar mi huella'}
          </button>
        </div>
      </div>
    </div>
  );
}
