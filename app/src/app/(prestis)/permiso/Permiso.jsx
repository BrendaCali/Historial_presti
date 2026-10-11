'use client';

import { useState } from 'react';
import { aUnidades } from '../../../lib/aval/config';
import { sinUmbral, useAval } from '../../AvalProvider';
import Icono from '../_componentes/Icono';

const campo = 'w-full h-11 px-3 rounded-lg bg-surface-container-high text-on-surface border border-surface-variant focus:outline-2 focus:outline-primary';

function Fila({ titulo, valor, destacado }) {
  return (
    <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col">
      <span className="font-label-sm text-label-sm text-on-surface-variant">{titulo}</span>
      <span className={`font-metric-mono text-metric-mono ${destacado ? 'text-primary' : 'text-on-surface'}`}>{valor}</span>
    </div>
  );
}

export default function Permiso() {
  const { datos, permisoActual, crearPermiso, revocarPermiso, pedirSaldo, ocupado, usd, refrescar } = useAval();
  const [porPago, setPorPago] = useState('50');
  const [total, setTotal] = useState('100');
  const [umbral, setUmbral] = useState('20');
  const [horas, setHoras] = useState('24');
  const [error, setError] = useState('');

  if (!datos) return null;

  const crear = (e) => {
    e.preventDefault();
    const pp = aUnidades(porPago), t = aUnidades(total), u = aUnidades(umbral), h = Number(horas);
    if (!pp || !t || !u) return setError('Escribe montos mayores que cero.');
    if (t < pp) return setError('El total no puede ser menor que el máximo por pago.');
    if (u > pp) return setError('El umbral de aprobación no puede superar el máximo por pago.');
    if (!(h >= 1 && h <= 720)) return setError('El vencimiento va de 1 a 720 horas.');
    if (datos.saldo < t) return setError(`Tu saldo (${usd(datos.saldo)} tUSD) no alcanza para ese total. Pide saldo de prueba o baja el total.`);
    setError('');
    crearPermiso({ porPago: pp, total: t, umbral: u, horas: h });
  };

  const p = permisoActual?.permit;
  const restante = p ? p.terms.maxTotal - p.spent : 0n;
  const vence = p ? new Date(Number(p.terms.expiresAt) * 1000) : null;

  return (
    <>
      <div className="bg-surface-container rounded-xl p-space-md flex items-center justify-between gap-space-sm">
        <div>
          <span className="font-label-sm text-label-sm text-on-surface-variant block">Tu saldo de prueba</span>
          <span className="font-headline-sm text-headline-sm text-primary">{usd(datos.saldo)} tUSD</span>
        </div>
        <button type="button" disabled={!!ocupado} onClick={pedirSaldo}
          className="h-10 px-space-md rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md disabled:opacity-60">
          {ocupado === 'faucet' ? 'Pidiendo…' : 'Pedir saldo'}
        </button>
      </div>

      {p ? (
        <section className="bg-surface-container rounded-xl p-space-md shadow-lg flex flex-col gap-space-md">
          <div className="flex items-center justify-between gap-space-sm">
            <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs">
              <Icono nombre="shield_person" tam={22} className="text-primary" /> Permiso #{String(permisoActual.permitId)}
            </h2>
            <span className="font-metric-mono text-label-sm uppercase px-2 py-0.5 rounded-full bg-primary-container/20 text-primary">Activo</span>
          </div>
          <div className="grid grid-cols-2 gap-space-sm">
            <Fila titulo="Máximo por pago" valor={`${usd(p.terms.maxPerSpend)} tUSD`} />
            <Fila titulo="Total del permiso" valor={`${usd(p.terms.maxTotal)} tUSD`} />
            <Fila titulo="Ya gastado" valor={`${usd(p.spent)} tUSD`} />
            <Fila titulo="Te queda" valor={`${usd(restante)} tUSD`} destacado />
            <Fila titulo="Pide tu huella sobre" valor={sinUmbral(p.terms.approvalThreshold) ? 'Nunca' : `${usd(p.terms.approvalThreshold)} tUSD`} />
            <Fila titulo="Vence" valor={vence.toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })} />
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Los fondos siguen en tu cuenta. El agente solo puede pagar al servicio de la lista, y el contrato rechaza todo lo que pase de estos límites.
          </p>
          <div className="flex gap-space-sm flex-wrap">
            <button type="button" disabled={!!ocupado} onClick={() => revocarPermiso(permisoActual.permitId)}
              className="h-11 px-space-lg rounded-xl bg-surface-container-high hover:bg-error-container text-error font-label-md text-label-md font-bold disabled:opacity-60">
              {ocupado === 'revoke' ? 'Revocando…' : 'Revocar permiso'}
            </button>
            <button type="button" disabled={!!ocupado} onClick={refrescar}
              className="h-11 px-space-lg rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md disabled:opacity-60">
              Actualizar desde la cadena
            </button>
          </div>
        </section>
      ) : (
        <form onSubmit={crear} className="bg-surface-container rounded-xl p-space-md shadow-lg flex flex-col gap-space-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Dale un permiso a tu agente</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Montos en tUSD (dólar de prueba). Firmas sin ventanas y sin gas: la sesión ya está abierta y el relayer envía.
          </p>
          <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
            Máximo por pago
            <input className={campo} type="number" inputMode="decimal" min="1" step="any" value={porPago} onChange={(e) => { setPorPago(e.target.value); setError(''); }} />
          </label>
          <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
            Total que puede gastar
            <input className={campo} type="number" inputMode="decimal" min="1" step="any" value={total} onChange={(e) => { setTotal(e.target.value); setError(''); }} />
          </label>
          <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
            Pagos mayores a esto esperan tu huella
            <input className={campo} type="number" inputMode="decimal" min="1" step="any" value={umbral} onChange={(e) => { setUmbral(e.target.value); setError(''); }} />
          </label>
          <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
            Vence en (horas)
            <input className={campo} type="number" inputMode="numeric" min="1" max="720" value={horas} onChange={(e) => { setHoras(e.target.value); setError(''); }} />
          </label>
          {error && <p role="alert" className="text-error font-body-sm text-body-sm">{error}</p>}
          <button type="submit" disabled={!!ocupado}
            className="h-12 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg font-bold disabled:opacity-60">
            {ocupado === 'permit' ? 'Creando permiso…' : 'Crear permiso'}
          </button>
        </form>
      )}
    </>
  );
}
