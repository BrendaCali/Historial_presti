'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { txUrl } from '../../../lib/aval/config';
import { sinUmbral, useAval } from '../../AvalProvider';
import Icono from '../_componentes/Icono';

const SUGERENCIAS = [
  'Necesito un préstamo de 300 Bs',
  'Qué ofertas hay con un presupuesto de 50 dólares',
  'Solicitudes de gente que necesita plata',
  '¿Cómo va mi cuenta? ¿Qué me toca hacer?',
];
const NOMBRES = {
  buscar_ofertas: 'Buscó ofertas', mi_resumen: 'Revisó tu cuenta', me_interesa: 'Preparó tu interés (lo confirmas con la huella)',
  consultar_permiso: 'Consultó tu permiso de pagos', pagar: 'Pagó (Aval)', pedir_aprobacion: 'Pidió tu aprobación (Aval)',
};

// Las ofertas que encontró el asistente se muestran como tarjetas que se pueden abrir.
function Ofertas({ r }) {
  if (!r?.ofertas?.length) return null;
  return (
    <div className="flex flex-col gap-2 mt-2">
      {r.ofertas.map((o) => (
        <Link key={o.id} href={`/tablon/${o.id}`} className="bg-surface-container-low hover:bg-surface-container-highest rounded-lg p-space-sm flex flex-col gap-0.5 text-on-surface">
          <span className="flex items-center justify-between gap-2">
            <span className="font-label-lg text-label-lg">{o.id} · {o.tipo === 'oferta' ? 'Ofrece' : 'Solicita'} Bs {o.monto_bs} <span className="font-metric-mono text-label-sm text-secondary">≈ US$ {o.monto_usd}</span></span>
            <Icono nombre="chevron_right" tam={18} className="text-primary shrink-0" />
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">{o.plazo_dias} días · {o.cuotas} cuota(s) · {o.tasa_mensual_pct}%/mes · devuelves Bs {o.total_a_devolver_bs} · {o.nivel_autor} · {o.interesados} interesado(s)</span>
        </Link>
      ))}
    </div>
  );
}

// El asistente prepara "Me interesa", pero quien lo registra es el usuario con su huella (passkey de Mera).
function ConfirmarInteres({ id }) {
  const { mercado, avisar, tocar } = useAval();
  const [estado, setEstado] = useState('pendiente'); // pendiente | trabajando | hecho
  const confirmar = async () => {
    setEstado('trabajando');
    try {
      await mercado('interesar', { id }, { huella: { titulo: `Mostrar interés en la publicación ${id}`, detalle: 'Quien publicó verá tu perfil y podrá elegirte para el trato.' } });
      tocar();
      setEstado('hecho');
      avisar('ok', `Quedó registrado tu interés en ${id}.`);
    } catch (e) {
      setEstado('pendiente');
      avisar('error', e.message);
    }
  };
  if (estado === 'hecho') return <p className="mt-2 font-label-md text-label-md text-primary flex items-center gap-1"><Icono nombre="check_circle" tam={18} /> Interés en {id} confirmado con tu huella.</p>;
  return (
    <button type="button" onClick={confirmar} disabled={estado === 'trabajando'} className="mt-2 h-11 px-4 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg font-bold flex items-center gap-2 disabled:opacity-60">
      <Icono nombre="fingerprint" tam={22} /> Confirmar con mi huella · {id}
    </button>
  );
}

function Pasos({ pasos }) {
  if (!pasos?.length) return null;
  return (
    <>
      {pasos.filter((p) => p.herramienta === 'buscar_ofertas').map((p, i) => <Ofertas key={i} r={p.resultado} />)}
      {pasos.filter((p) => p.herramienta === 'me_interesa' && p.resultado?.requiere_huella).map((p, i) => <ConfirmarInteres key={i} id={p.resultado.id} />)}
      <details className="mt-2 text-on-surface-variant">
        <summary className="cursor-pointer font-label-sm text-label-sm">Lo que hizo ({pasos.length} paso{pasos.length > 1 ? 's' : ''})</summary>
        <ol className="mt-1 flex flex-col gap-1">
          {pasos.map((p, i) => (
            <li key={i} className="bg-surface-container-low rounded-lg p-space-sm font-metric-mono text-label-sm break-words">
              <span className="text-primary">{NOMBRES[p.herramienta] ?? p.herramienta}</span>
              {p.entrada?.presupuesto !== undefined && <> · hasta {p.entrada.presupuesto} {p.entrada.moneda ?? 'BOB'}</>}
              {p.entrada?.monto_tusd !== undefined && <> · {p.entrada.monto_tusd} tUSD ({p.entrada.concepto})</>}
              <br />
              {p.resultado?.bloqueado_por_el_contrato ? <span className="text-tertiary">Bloqueado por el contrato: {p.resultado.mensaje}</span>
                : p.resultado?.ok === false ? <span className="text-error">{p.resultado.mensaje}</span>
                : p.resultado?.tx ? <a className="text-primary hover:underline" href={txUrl(p.resultado.tx)} target="_blank" rel="noreferrer">ver transacción</a>
                : p.resultado?.cantidad !== undefined ? <>{p.resultado.cantidad} resultado(s)</>
                : p.resultado?.saldo_bs !== undefined ? <>saldo Bs {p.resultado.saldo_bs}</>
                : p.resultado?.queda_tusd !== undefined ? <>queda {p.resultado.queda_tusd} tUSD · máx. por pago {p.resultado.maximo_por_pago_tusd}</>
                : p.resultado?.pendiente ? <>pendiente #{p.resultado.id_pedido}</> : null}
            </li>
          ))}
        </ol>
      </details>
    </>
  );
}

export default function Asistente() {
  const { permisoActual, refrescarAhora, tocar, anotar, avisar, usd, memoriaId, leerMemoria, guardarMemoria, borrarMemoria, peticionFirmada } = useAval();
  const [mensajes, setMensajes] = useState([]); // la memoria cifrada la restaura al entrar
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [conPagos, setConPagos] = useState(false); // pagos autorizados (Aval): apagados por defecto
  const fin = useRef(null);
  const [mem, setMem] = useState({ estado: 'cargando' });
  const cargada = useRef(false);

  // Al entrar (en este u otro dispositivo) se recupera la memoria cifrada con la clave derivada de la huella.
  useEffect(() => {
    if (cargada.current || !memoriaId) return;
    cargada.current = true;
    leerMemoria()
      .then((m) => {
        if (m.mensajes.length) setMensajes(m.mensajes);
        setMem({ estado: 'lista', almacen: m.almacen, bytes: m.bytes, restaurados: m.mensajes.length });
      })
      .catch((e) => setMem({ estado: 'error', texto: e.message }));
  }, [memoriaId, leerMemoria]);

  useEffect(() => { fin.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [mensajes, pensando]);

  const olvidar = async () => {
    try {
      await borrarMemoria();
      setMensajes([]);
      setMem((m) => ({ ...m, estado: 'lista', bytes: 0, restaurados: 0 }));
      avisar('ok', 'Memoria borrada.');
    } catch (e) {
      avisar('error', e.message);
    }
  };

  const p = permisoActual?.permit;
  const enviar = async (contenido) => {
    const limpio = contenido.trim();
    if (!limpio || pensando) return;
    const historial = [...mensajes, { role: 'user', content: limpio }];
    setMensajes(historial);
    setTexto('');
    setPensando(true);
    tocar();
    try {
      const datos = { mensajes: historial.map(({ role, content }) => ({ role, content })), ...(conPagos && permisoActual ? { permitId: String(permisoActual.permitId) } : {}) };
      const r = await fetch('/api/agente', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(await peticionFirmada('asistente', datos)) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'El asistente no respondió.');
      const completo = [...historial, { role: 'assistant', content: j.respuesta, pasos: j.pasos, modelo: j.modelo }];
      setMensajes(completo);
      guardarMemoria(completo)
        .then((g) => setMem({ estado: 'lista', almacen: g.almacen, bytes: g.bytes, restaurados: 0 }))
        .catch((e) => setMem({ estado: 'error', texto: e.message }));
      if (j.pasos?.some((x) => !['buscar_ofertas', 'mi_resumen'].includes(x.herramienta))) { anotar(`Asistente (${j.modelo}): ${j.pasos.length} paso(s)`); await refrescarAhora(); }
    } catch (e) {
      setMensajes([...historial, { role: 'assistant', content: `No pude completar eso: ${e.message}`, error: true }]);
      avisar('error', e.message);
    } finally {
      setPensando(false);
    }
  };

  return (
    <>
      <div className="bg-surface-container rounded-xl p-space-md flex flex-col gap-1">
        <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs"><Icono nombre="smart_toy" tam={22} className="text-primary" /> Tu asistente de préstamos</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Dile cuánto necesitas o cuánto puedes prestar, en bolivianos o en dólares. Busca ofertas y solicitudes, compara condiciones y te dice qué te toca hacer.
          <b> Consultar no pide permisos ni mueve dinero.</b>
        </p>
      </div>

      <div className="bg-surface-container-low rounded-xl p-space-sm flex flex-col gap-1">
        <div className="flex items-center justify-between gap-space-sm flex-wrap">
          <span className="font-label-md text-label-md text-on-surface flex items-center gap-1"><Icono nombre="lock" tam={16} className="text-primary" /> Memoria cifrada con tu huella</span>
          <span className="font-metric-mono text-label-sm text-on-surface-variant">
            {mem.estado === 'cargando' && 'recuperando…'}
            {mem.estado === 'error' && <span className="text-error">{mem.texto}</span>}
            {mem.estado === 'lista' && (mem.restaurados > 0 ? `${mem.restaurados} mensajes recuperados` : mem.bytes ? 'guardada' : 'vacía')}
          </span>
        </div>
        <details className="font-body-sm text-body-sm text-on-surface-variant">
          <summary className="cursor-pointer font-label-sm text-label-sm">Qué ve el servidor</summary>
          <div className="mt-1 flex flex-col gap-1">
            <p>El navegador cifra la conversación con una clave que sale de tu huella (espacio <code>preste/memoria/clave/v1</code>) y la guarda bajo un identificador anónimo (<code>preste/memoria/id/v1</code>) que no es tu dirección. El servidor solo ve texto cifrado. En otro dispositivo, con la misma huella, se descifra igual.</p>
            <p className="font-metric-mono text-label-sm break-all">id: {memoriaId ? `${memoriaId.slice(0, 16)}…` : '—'} · {mem.bytes ? `${mem.bytes} caracteres cifrados` : 'sin datos'} · almacén: {mem.almacen ?? '—'}</p>
            <button type="button" onClick={olvidar} className="self-start h-8 px-3 rounded-lg bg-surface-container-high hover:bg-surface-bright text-error font-label-sm text-label-sm">Borrar memoria</button>
          </div>
        </details>
      </div>

      <section aria-label="Conversación con tu asistente" className="bg-surface-container rounded-xl p-space-md flex flex-col gap-space-sm min-h-72">
        {mensajes.length === 0 && (
          <div className="flex flex-col gap-space-sm">
            <p className="font-body-sm text-body-sm text-on-surface-variant">Prueba con una de estas:</p>
            <div className="flex flex-wrap gap-2">
              {SUGERENCIAS.map((s) => <button key={s} type="button" onClick={() => enviar(s)} className="h-9 px-3 rounded-full bg-surface-container-high hover:bg-surface-bright text-primary font-label-md text-label-md text-left">{s}</button>)}
            </div>
          </div>
        )}
        {mensajes.map((m, i) => (
          <div key={i} className={`max-w-[94%] rounded-2xl px-space-md py-space-sm ${m.role === 'user' ? 'self-end bg-primary text-on-primary' : `self-start ${m.error ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface'}`}`}>
            <p className="font-body-md text-body-md whitespace-pre-wrap">{m.content}</p>
            {m.role === 'assistant' && <Pasos pasos={m.pasos} />}
            {m.modelo && <span className={`mt-1 inline-block font-metric-mono text-[10px] uppercase ${m.modelo === 'simulado' ? 'text-tertiary' : 'text-on-surface-variant'}`}>{m.modelo === 'simulado' ? 'Modo simulado (no es Qwen)' : m.modelo}</span>}
          </div>
        ))}
        {pensando && <div className="self-start bg-surface-container-high rounded-2xl px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant" role="status">Tu asistente está buscando…</div>}
        <div ref={fin} />
      </section>

      <form onSubmit={(e) => { e.preventDefault(); enviar(texto); }} className="flex gap-space-sm">
        <input value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={400} aria-label="Escribe qué buscas" placeholder="Ej.: necesito hasta 200 Bs a 30 días"
          className="flex-1 h-12 px-4 rounded-xl bg-surface-container-high text-on-surface border border-surface-variant focus:outline-2 focus:outline-primary" />
        <button type="submit" disabled={pensando || !texto.trim()} className="h-12 px-space-lg rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg font-bold disabled:opacity-50 flex items-center gap-1"><Icono nombre="send" tam={18} /> Enviar</button>
      </form>

      {/* Pagos autorizados con Aval: función aparte y opcional */}
      <details className="bg-surface-container rounded-xl p-space-md" open={conPagos}>
        <summary className="cursor-pointer font-label-lg text-label-lg text-on-surface flex items-center gap-space-xs list-none"><Icono nombre="shield_person" tam={20} className="text-primary" /> Pagos autorizados (Aval) · opcional</summary>
        <div className="mt-space-sm flex flex-col gap-space-sm">
          <p className="font-body-sm text-body-sm text-on-surface-variant">Separado de los préstamos. Si le das un permiso con límites, tu asistente puede hacer pagos pequeños en tUSD por ti; los grandes esperan tu huella. Sin permiso, el asistente solo consulta.</p>
          {permisoActual ? (
            <>
              <span className="font-metric-mono text-label-md text-on-surface">Permiso #{String(permisoActual.permitId)} · te quedan {usd(p.terms.maxTotal - p.spent)} tUSD · {sinUmbral(p.terms.approvalThreshold) ? 'sin umbral' : `huella sobre ${usd(p.terms.approvalThreshold)}`}</span>
              <label className="flex items-center gap-2 font-label-md text-label-md text-on-surface">
                <input type="checkbox" checked={conPagos} onChange={(e) => setConPagos(e.target.checked)} className="w-5 h-5 accent-primary" />
                Permitir que el asistente pague con este permiso en esta conversación
              </label>
            </>
          ) : (
            <Link href="/permiso" className="self-start h-10 px-4 rounded-lg bg-surface-container-high hover:bg-surface-bright text-primary font-label-md text-label-md flex items-center gap-1"><Icono nombre="shield_person" tam={18} /> Crear un permiso de pagos</Link>
          )}
        </div>
      </details>
    </>
  );
}
