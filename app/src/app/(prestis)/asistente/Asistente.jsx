'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { txUrl } from '../../../lib/aval/config';
import { sinUmbral, useAval } from '../../AvalProvider';
import Icono from '../_componentes/Icono';

const SUGERENCIAS = ['Paga 10 de luz', 'Paga 35 de internet', '¿Cuánto me queda del permiso?'];
const NOMBRES = { consultar_permiso: 'Consultó tu permiso', pagar: 'Pagó', pedir_aprobacion: 'Pidió tu aprobación', resenar_servicio: 'Reseñó al servicio' };

function Pasos({ pasos }) {
  if (!pasos?.length) return null;
  return (
    <details className="mt-2 text-on-surface-variant">
      <summary className="cursor-pointer font-label-sm text-label-sm">Lo que hizo ({pasos.length} paso{pasos.length > 1 ? 's' : ''})</summary>
      <ol className="mt-1 flex flex-col gap-1">
        {pasos.map((p, i) => (
          <li key={i} className="bg-surface-container-low rounded-lg p-space-sm font-metric-mono text-label-sm break-words">
            <span className="text-primary">{NOMBRES[p.herramienta] ?? p.herramienta}</span>
            {p.entrada?.monto_tusd !== undefined && <> · {p.entrada.monto_tusd} tUSD ({p.entrada.concepto})</>}
            <br />
            {p.resultado?.bloqueado_por_el_contrato
              ? <span className="text-tertiary">Bloqueado por el contrato: {p.resultado.mensaje}</span>
              : p.resultado?.ok === false
                ? <span className="text-error">{p.resultado.mensaje}</span>
                : p.resultado?.tx
                  ? <a className="text-primary hover:underline" href={txUrl(p.resultado.tx)} target="_blank" rel="noreferrer">ver transacción</a>
                  : p.resultado?.queda_tusd !== undefined
                    ? <>queda {p.resultado.queda_tusd} · máx. por pago {p.resultado.maximo_por_pago_tusd} · umbral {p.resultado.umbral_aprobacion_tusd}</>
                    : p.resultado?.pendiente ? <>pendiente #{p.resultado.id_pedido}</> : null}
          </li>
        ))}
      </ol>
    </details>
  );
}

export default function Asistente() {
  const { datos, permisoActual, refrescarAhora, tocar, anotar, avisar, usd } = useAval();
  const [mensajes, setMensajes] = useState([]); // solo en memoria
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const fin = useRef(null);

  useEffect(() => { fin.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [mensajes, pensando]);

  if (!datos) return null;

  if (!permisoActual) {
    return (
      <div className="bg-surface-container rounded-xl p-space-xl text-center flex flex-col items-center gap-space-sm">
        <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-primary"><Icono nombre="shield_person" tam={28} /></div>
        <p className="font-headline-sm text-headline-sm text-on-surface">Primero dale un permiso a tu asistente.</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">Fijas cuánto puede pagar, cuánto en total y desde qué monto te pide la huella. Los fondos siguen en tu cuenta.</p>
        <Link href="/permiso" className="h-11 px-space-lg rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg font-bold flex items-center gap-2">
          <Icono nombre="shield_person" tam={18} /> Crear permiso
        </Link>
      </div>
    );
  }

  const p = permisoActual.permit;
  const restante = p.terms.maxTotal - p.spent;

  const enviar = async (contenido) => {
    const limpio = contenido.trim();
    if (!limpio || pensando) return;
    const historial = [...mensajes, { role: 'user', content: limpio }];
    setMensajes(historial);
    setTexto('');
    setPensando(true);
    tocar();
    try {
      const r = await fetch('/api/agente', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mensajes: historial.map(({ role, content }) => ({ role, content })), permitId: String(permisoActual.permitId) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'El asistente no respondió.');
      setMensajes([...historial, { role: 'assistant', content: j.respuesta, pasos: j.pasos, modelo: j.modelo }]);
      if (j.pasos?.some((x) => x.herramienta !== 'consultar_permiso')) anotar(`Asistente (${j.modelo}): ${j.pasos.length} paso(s)`);
      await refrescarAhora();
    } catch (e) {
      setMensajes([...historial, { role: 'assistant', content: `No pude completar eso: ${e.message}`, error: true }]);
      avisar('error', e.message);
    } finally {
      setPensando(false);
    }
  };

  return (
    <>
      <div className="bg-surface-container rounded-xl p-space-md flex items-center justify-between gap-space-sm flex-wrap">
        <div>
          <span className="font-label-sm text-label-sm text-on-surface-variant block">Te queda del permiso #{String(permisoActual.permitId)}</span>
          <span className="font-headline-sm text-headline-sm text-primary">{usd(restante)} tUSD</span>
        </div>
        <div className="text-right font-label-sm text-label-sm text-on-surface-variant">
          Máx. por pago {usd(p.terms.maxPerSpend)}<br />
          {sinUmbral(p.terms.approvalThreshold) ? 'Sin umbral de aprobación' : `Huella sobre ${usd(p.terms.approvalThreshold)}`}
        </div>
      </div>

      <section aria-label="Conversación con tu asistente" className="bg-surface-container rounded-xl p-space-md flex flex-col gap-space-sm min-h-72">
        {mensajes.length === 0 && (
          <div className="flex flex-col gap-space-sm">
            <p className="font-body-sm text-body-sm text-on-surface-variant">Pídele un pago en tus palabras. Planifica, consulta tu permiso y paga solo dentro de tus límites; lo grande te lo pide a ti.</p>
            <div className="flex flex-wrap gap-2">
              {SUGERENCIAS.map((s) => (
                <button key={s} type="button" onClick={() => enviar(s)} className="h-9 px-3 rounded-full bg-surface-container-high hover:bg-surface-bright text-primary font-label-md text-label-md">{s}</button>
              ))}
            </div>
          </div>
        )}
        {mensajes.map((m, i) => (
          <div key={i} className={`max-w-[92%] rounded-2xl px-space-md py-space-sm ${m.role === 'user' ? 'self-end bg-primary text-on-primary' : `self-start ${m.error ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface'}`}`}>
            <p className="font-body-md text-body-md whitespace-pre-wrap">{m.content}</p>
            {m.role === 'assistant' && <Pasos pasos={m.pasos} />}
            {m.modelo && (
              <span className={`mt-1 inline-block font-metric-mono text-[10px] uppercase ${m.modelo === 'simulado' ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                {m.modelo === 'simulado' ? 'Modo simulado (no es Qwen)' : m.modelo}
              </span>
            )}
          </div>
        ))}
        {pensando && <div className="self-start bg-surface-container-high rounded-2xl px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant" role="status">Tu asistente está trabajando…</div>}
        <div ref={fin} />
      </section>

      <form onSubmit={(e) => { e.preventDefault(); enviar(texto); }} className="flex gap-space-sm">
        <input value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={400} aria-label="Escribe qué quieres pagar" placeholder="Ej.: paga 10 de luz y 8 de agua"
          className="flex-1 h-12 px-4 rounded-xl bg-surface-container-high text-on-surface border border-surface-variant focus:outline-2 focus:outline-primary" />
        <button type="submit" disabled={pensando || !texto.trim()} className="h-12 px-space-lg rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg font-bold disabled:opacity-50 flex items-center gap-1">
          <Icono nombre="send" tam={18} /> Enviar
        </button>
      </form>
    </>
  );
}
