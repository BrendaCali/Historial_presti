'use client';

import { useEffect, useState } from 'react';
import { monadTestnet } from '../../../vendor/aval-sdk/index.js';
import { addressUrl, txUrl } from '../../../lib/aval/config';
import { actividadToken } from '../../../lib/alchemy';
import { useAval } from '../../AvalProvider';
import Icono from '../_componentes/Icono';
import PuntajeVerificado from './PuntajeVerificado';
import { etiquetaRef } from '../aprobaciones/Aprobaciones';

const corta = (d) => `${d.slice(0, 8)}…${d.slice(-6)}`;

function Tarjeta({ icono, titulo, children }) {
  return (
    <section className="bg-surface-container rounded-xl p-space-md shadow-md flex flex-col gap-space-sm">
      <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs">
        <Icono nombre={icono} tam={20} className="text-primary" /> {titulo}
      </h2>
      {children}
    </section>
  );
}

export default function Actividad() {
  const { datos, direccion, historial, metricas, modo, bloquear, olvidar, usd, refrescar, ocupado } = useAval();
  const [movs, setMovs] = useState(null);

  useEffect(() => {
    if (!direccion) return;
    actividadToken(direccion, monadTestnet.testUsd).then(setMovs).catch(() => setMovs([]));
  }, [direccion, datos?.at]);

  if (!datos) return null;
  const { reputacion, recibos, agente } = datos;
  const nota = reputacion.count > 0n ? Number(reputacion.value) / 10 ** reputacion.decimals : null;

  return (
    <>
      <Tarjeta icono="verified" titulo="Reputación del servicio al que paga tu agente">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          ERC-8004 deja reseñar a cualquiera, incluso con cuentas falsas. Aquí solo cuentan las reseñas de quienes <b>de verdad le pagaron</b> (recibos onchain).
        </p>
        <div className="grid grid-cols-3 gap-space-sm text-center">
          <div className="bg-surface-container-low rounded-lg py-space-sm"><span className="font-label-sm text-label-sm text-on-surface-variant block">Puntaje</span><span className="font-headline-sm text-headline-sm text-primary">{nota === null ? '—' : nota.toFixed(0)}<span className="text-label-sm"> /100</span></span></div>
          <div className="bg-surface-container-low rounded-lg py-space-sm"><span className="font-label-sm text-label-sm text-on-surface-variant block">Reseñas válidas</span><span className="font-headline-sm text-headline-sm text-on-surface">{String(reputacion.count)}</span></div>
          <div className="bg-surface-container-low rounded-lg py-space-sm"><span className="font-label-sm text-label-sm text-on-surface-variant block">Clientes</span><span className="font-headline-sm text-headline-sm text-on-surface">{String(reputacion.verifiedClients)}</span></div>
        </div>
        <a className="font-metric-mono text-label-sm text-primary hover:underline" href={addressUrl(agente.service.address)} target="_blank" rel="noreferrer">
          Servicio #{String(agente.service.agentId)} · {corta(agente.service.address)}
        </a>
      </Tarjeta>

      <PuntajeVerificado />

      <Tarjeta icono="receipt_long" titulo="Pagos de tu agente (recibos onchain)">
        {recibos.length === 0 ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant">Todavía no hay pagos. Cuando tu agente pague, el recibo se lee de la cadena y aparece aquí.</p>
        ) : (
          [...recibos].reverse().map((r, i) => (
            <div key={`${r.timestamp}-${i}`} className="bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between gap-space-sm">
              <div className="min-w-0">
                <span className="font-label-lg text-label-lg text-on-surface block truncate">{etiquetaRef(r.ref)}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {new Date(Number(r.timestamp) * 1000).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                  {r.requestId > 0n ? ' · aprobado con huella' : ' · dentro de tus límites'}
                </span>
              </div>
              <span className="font-metric-mono text-metric-mono text-primary shrink-0">{usd(r.amount)} tUSD</span>
            </div>
          ))
        )}
      </Tarjeta>

      <Tarjeta icono="swap_horiz" titulo="Movimientos de tUSD (vía Alchemy)">
        <p className="font-body-sm text-body-sm text-on-surface-variant">Leídos con <code>alchemy_getAssetTransfers</code>: todo lo que entró y salió de tu cuenta, sin escanear bloques.</p>
        {movs === null && <span className="font-body-sm text-on-surface-variant">Consultando…</span>}
        {movs?.length === 0 && <span className="font-body-sm text-on-surface-variant">Sin movimientos todavía.</span>}
        {movs?.map((m) => (
          <a key={m.hash} href={txUrl(m.hash)} target="_blank" rel="noreferrer"
            className="bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between gap-space-sm hover:bg-surface-container-high">
            <span className="font-label-lg text-label-lg text-on-surface">{m.tipo === 'recibido' ? '↓ Recibiste' : '↑ Salió'}</span>
            <span className="font-metric-mono text-metric-mono text-primary">{Number(m.valor).toFixed(2)} tUSD</span>
          </a>
        ))}
      </Tarjeta>

      <Tarjeta icono="timer" titulo="Alcance de la sesión (qué pide huella y qué no)">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Al entrar con tu huella se abre una sesión de firma de Mera: la clave vive solo en memoria y se bloquea sola a los 10 minutos sin actividad. El reloj de arriba muestra cuánto falta.
        </p>
        <div className="flex flex-col gap-1">
          {[
            ['Sin pedir huella', 'Ver tu saldo, permisos, recibos y reputación · crear o revocar un permiso · pedir saldo de prueba · hablar con el asistente y recuperar su memoria', 'bg-primary-container/20'],
            ['Siempre pide huella', 'Aprobar un pago grande (la firma se verifica en la cadena con P256) · volver a entrar tras bloquear la sesión o recargar la página', 'bg-tertiary/20'],
          ].map(([t, d, fondo]) => (
            <div key={t} className={`rounded-lg p-space-sm ${fondo}`}>
              <span className="font-label-lg text-label-lg text-on-surface block">{t}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{d}</span>
            </div>
          ))}
        </div>
      </Tarjeta>

      <Tarjeta icono="key" titulo="Una huella, varias llaves (Mera)">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Todas salen de la misma huella, nada se guarda en el navegador, y se vuelven a derivar en cualquier dispositivo.
        </p>
        <div className="flex flex-col gap-1">
          {[
            ['Cuenta de Monad', 'Firma permisos y aprobaciones', 'sal por defecto de Mera'],
            ['Clave de memoria', 'Cifra la conversación del asistente (no es de cuenta)', 'preste/memoria/clave/v1'],
            ['Identificador anónimo', 'Dónde se guarda esa memoria, sin ligarla a tu dirección', 'preste/memoria/id/v1'],
          ].map(([n, uso, esp]) => (
            <div key={n} className="bg-surface-container-low rounded-lg p-space-sm">
              <span className="font-label-lg text-label-lg text-on-surface block">{n}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant block">{uso}</span>
              <code className="font-metric-mono text-label-sm text-primary">{esp}</code>
            </div>
          ))}
        </div>
      </Tarjeta>

      <Tarjeta icono="speed" titulo="Experiencia con Mera">
        <div className="grid grid-cols-3 gap-space-sm text-center">
          <div className="bg-surface-container-low rounded-lg py-space-sm"><span className="font-label-sm text-label-sm text-on-surface-variant block">Cuenta lista</span><span className="font-metric-mono text-metric-mono text-on-surface">{metricas.listoMs === null ? '—' : `${(metricas.listoMs / 1000).toFixed(1)} s`}</span></div>
          <div className="bg-surface-container-low rounded-lg py-space-sm"><span className="font-label-sm text-label-sm text-on-surface-variant block">1.ª transacción</span><span className="font-metric-mono text-metric-mono text-on-surface">{metricas.primeraTxMs === null ? '—' : `${(metricas.primeraTxMs / 1000).toFixed(1)} s`}</span></div>
          <div className="bg-surface-container-low rounded-lg py-space-sm"><span className="font-label-sm text-label-sm text-on-surface-variant block">Huellas pedidas</span><span className="font-metric-mono text-metric-mono text-on-surface">{metricas.huellasHastaListo ?? '—'}</span></div>
        </div>
        {modo === 'simulated' && <p className="font-label-sm text-label-sm text-tertiary">Estás probando sin passkey real: estas cifras no cuentan para la demo.</p>}
        <div className="flex gap-space-sm flex-wrap">
          <button type="button" onClick={() => bloquear('Sesión bloqueada. Usa tu huella para continuar.')}
            className="h-11 px-space-lg rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md">Bloquear sesión</button>
          <button type="button" onClick={olvidar}
            className="h-11 px-space-lg rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md">Probar como dispositivo nuevo</button>
          <button type="button" disabled={!!ocupado} onClick={refrescar}
            className="h-11 px-space-lg rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md disabled:opacity-60">Actualizar</button>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Esto borra todo lo que el navegador recuerda. Con tu misma huella, tu cuenta, tus permisos y tus recibos vuelven a aparecer, porque viven en la cadena y no en esta app.
        </p>
      </Tarjeta>

      <Tarjeta icono="terminal" titulo="Datos técnicos (para jueces)">
        <dl className="font-metric-mono text-label-sm text-on-surface-variant flex flex-col gap-1 break-all">
          <div><dt className="inline">Tu cuenta: </dt><dd className="inline text-on-surface">{direccion}</dd></div>
          <div><dt className="inline">Clave P256 registrada: </dt><dd className="inline text-on-surface">{datos.p256 ? 'sí' : 'no'}</dd></div>
          <div><dt className="inline">AgentPermit: </dt><dd className="inline"><a className="text-primary hover:underline" href={addressUrl(monadTestnet.agentPermit)} target="_blank" rel="noreferrer">{monadTestnet.agentPermit}</a></dd></div>
          <div><dt className="inline">PasskeyRegistry: </dt><dd className="inline"><a className="text-primary hover:underline" href={addressUrl(monadTestnet.passkeyRegistry)} target="_blank" rel="noreferrer">{monadTestnet.passkeyRegistry}</a></dd></div>
          <div><dt className="inline">Agente: </dt><dd className="inline text-on-surface">{agente.address}</dd></div>
        </dl>
        {historial.length > 0 && (
          <div className="flex flex-col gap-1 pt-space-xs">
            {historial.slice(0, 12).map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-2 font-label-sm text-label-sm text-on-surface-variant">
                <span className="truncate">{h.titulo}</span>
                <span className="shrink-0 font-metric-mono">
                  {h.ms ? `${Math.round(h.ms)} ms` : ''}
                  {h.hash && <> · <a className="text-primary hover:underline" href={txUrl(h.hash)} target="_blank" rel="noreferrer">tx</a></>}
                </span>
              </div>
            ))}
          </div>
        )}
      </Tarjeta>
    </>
  );
}
