'use client';

import { useState } from 'react';
import { REGLAS } from '../../../lib/mercado/logica';
import { aCentavos, bs, fecha, usdAprox } from '../../../lib/formato';
import Icono from '../_componentes/Icono';
import { useAccion, useVista } from '../_componentes/useMercado';

const campo = 'w-full h-12 px-3 rounded-lg bg-surface-container-high text-on-surface border border-surface-variant focus:outline-2 focus:outline-primary';
const ETIQUETAS = {
  'deposito-entrada': 'Depósito de prueba', 'retiro-salida': 'Retiro de prueba',
  'desembolso-entrada': 'Préstamo recibido', 'desembolso-salida': 'Préstamo desembolsado',
  'abono-entrada': 'Abono recibido', 'abono-salida': 'Abono pagado',
};

function Formulario({ titulo, boton, icono, sugeridos, ocupado, onEnviar, ayuda }) {
  const [monto, setMonto] = useState('');
  const [error, setError] = useState('');
  const enviar = (e) => {
    e.preventDefault();
    const c = aCentavos(monto);
    if (!c) return setError('Escribe un monto mayor que cero.');
    setError('');
    onEnviar(c, () => setMonto(''));
  };
  return (
    <form onSubmit={enviar} className="bg-surface-container rounded-xl p-space-md flex flex-col gap-space-sm">
      <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs"><Icono nombre={icono} tam={20} className="text-primary" /> {titulo}</h2>
      <div className="flex gap-2 flex-wrap">
        {sugeridos.map((s) => (
          <button key={s} type="button" onClick={() => { setMonto(String(s)); setError(''); }}
            className="h-9 px-3 rounded-full bg-surface-container-high hover:bg-surface-bright text-primary font-label-md text-label-md">Bs {s}</button>
        ))}
      </div>
      <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
        Monto (Bs)
        <input className={campo} inputMode="decimal" placeholder="0.00" value={monto} onChange={(e) => { setMonto(e.target.value); setError(''); }} />
      </label>
      {ayuda && <p className="font-label-sm text-label-sm text-on-surface-variant">{ayuda}</p>}
      {error && <p role="alert" className="text-error font-body-sm text-body-sm">{error}</p>}
      <button type="submit" disabled={!!ocupado} className="h-12 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg font-bold disabled:opacity-60">
        {ocupado ? 'Procesando…' : boton}
      </button>
    </form>
  );
}

export default function Billetera() {
  const { datos, error, recargar } = useVista('ver-cuenta');
  const { ocupado, ejecutar } = useAccion(recargar);
  if (!datos) return <p className="font-body-sm text-body-sm text-on-surface-variant">{error || 'Cargando tu billetera…'}</p>;

  return (
    <>
      <section className="bg-surface-container rounded-xl p-space-lg shadow-lg flex flex-col gap-1">
        <span className="font-label-sm text-label-sm text-on-surface-variant">Tu saldo</span>
        <span className="font-display-score-mobile text-display-score-mobile text-primary leading-none">{bs(datos.saldo)}</span>
        <span className="font-metric-mono text-label-md text-secondary">{usdAprox(datos.saldo)} · Bs de prueba</span>
      </section>

      <div className="rounded-xl bg-secondary-container/40 p-space-sm flex items-start gap-space-sm">
        <Icono nombre="info" tam={18} className="text-primary shrink-0 mt-0.5" />
        <p className="font-body-sm text-body-sm text-on-surface">
          Es dinero de <b>prueba</b>: depositar y retirar simulan el paso con tu banco o tu billetera móvil. Los préstamos, desembolsos y abonos
          mueven estos saldos de verdad entre las dos personas del trato, con validaciones y registro.
        </p>
      </div>

      <div className="grid gap-space-md md:grid-cols-2 items-start">
        <Formulario titulo="Depositar" boton="Depositar" icono="south_west" sugeridos={[50, 100, 200, 500]} ocupado={ocupado === 'dep'}
          ayuda={`Cada depósito va de ${bs(REGLAS.DEPOSITO_MIN)} a ${bs(REGLAS.DEPOSITO_MAX)}. Hoy depositaste ${bs(datos.depositadoHoy)} de ${bs(REGLAS.DEPOSITO_DIA)}.`}
          onEnviar={(monto, limpiar) => ejecutar('dep', 'depositar', { monto }, `Depositaste ${bs(monto)}.`).then((r) => r && limpiar())} />
        <Formulario titulo="Retirar" boton="Retirar" icono="north_east" sugeridos={[50, 100, 200]} ocupado={ocupado === 'ret'}
          ayuda={`No puedes retirar más de lo que tienes. Mínimo ${bs(REGLAS.RETIRO_MIN)}.`}
          onEnviar={(monto, limpiar) => ejecutar('ret', 'retirar', { monto }, `Retiraste ${bs(monto)}.`).then((r) => r && limpiar())} />
      </div>

      <section className="bg-surface-container rounded-xl p-space-md flex flex-col gap-space-sm">
        <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs"><Icono nombre="receipt_long" tam={20} className="text-primary" /> Movimientos</h2>
        {datos.mov.length === 0 && <p className="font-body-sm text-body-sm text-on-surface-variant">Todavía no hay movimientos. Deposita para empezar.</p>}
        {datos.mov.map((m, i) => (
          <div key={`${m.t}-${i}`} className="bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between gap-space-sm">
            <div className="min-w-0">
              <span className="font-label-lg text-label-lg text-on-surface block">{ETIQUETAS[m.tipo] ?? m.tipo}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{fecha(m.t)} · {m.ref}</span>
            </div>
            <span className={`font-metric-mono text-metric-mono shrink-0 ${m.monto >= 0 ? 'text-primary' : 'text-on-surface'}`}>{m.monto >= 0 ? '+' : '−'}{bs(Math.abs(m.monto))}</span>
          </div>
        ))}
      </section>
    </>
  );
}
