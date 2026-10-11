'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAval } from '../../AvalProvider';
import Icono from '../_componentes/Icono';

const FILTROS = [
  { id: 'todos', texto: 'Todos' },
  { id: 'oferta', texto: 'Puedo Prestar', icono: 'volunteer_activism', color: 'text-primary' },
  { id: 'solicitud', texto: 'Necesito Préstamo', icono: 'request_quote', color: 'text-secondary' },
  { id: 'cochabamba', texto: 'En Cochabamba', icono: 'location_on', color: 'text-tertiary' },
];

const PUBLICACIONES = [
  { id: 'alan', tipo: 'oferta', Tarjeta: TarjetaAlan },
  { id: 'jose', tipo: 'solicitud', Tarjeta: TarjetaJose },
  { id: 'brenda', tipo: 'oferta', Tarjeta: TarjetaBrenda },
];

export default function Publicaciones() {
  const [filtro, setFiltro] = useState('todos');
  const [propias, setPropias] = useState([]);
  const [abierto, setAbierto] = useState(false);
  // Todas las publicaciones de ejemplo están en Cochabamba.
  const visibles = PUBLICACIONES.filter((p) => filtro === 'todos' || filtro === 'cochabamba' || p.tipo === filtro);
  const propiasVisibles = propias.filter((p) => filtro === 'todos' || filtro === 'cochabamba' || p.tipo === filtro);

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}
        className="w-full h-13 py-3 px-space-md bg-primary hover:bg-primary-fixed-dim active:scale-[0.99] transition-all rounded-xl flex items-center justify-between shadow-lg shadow-primary/20 text-on-primary">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-on-primary/15 flex items-center justify-center">
            <Icono nombre="add" tam={18} />
          </div>
          <span className="font-label-lg text-label-lg font-bold tracking-wide">Publicar en el Tablón</span>
        </div>
        <Icono nombre="arrow_forward" tam={20} />
      </button>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-margin px-margin sin-scrollbar">
        {FILTROS.map((f) => {
          const activo = filtro === f.id;
          return (
            <button key={f.id} type="button" onClick={() => setFiltro(f.id)} aria-pressed={activo}
              className={`shrink-0 h-9 px-3.5 rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-all active:scale-95 ${
                activo ? 'bg-primary text-on-primary shadow-md shadow-primary/20' : 'bg-surface-container-high text-on-surface hover:text-primary hover:bg-surface-variant'
              }`}>
              {f.icono && <Icono nombre={f.icono} tam={16} className={activo ? '' : f.color} />}
              <span>{f.texto}</span>
              {f.id === 'todos' && <span className="text-label-sm bg-on-primary/20 px-1.5 py-0.5 rounded-full">14</span>}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 items-start">
        {propiasVisibles.map((p) => <TarjetaPropia key={p.id} {...p} />)}
        {visibles.map(({ id, Tarjeta }) => <Tarjeta key={id} />)}
      </div>

      {abierto && (
        <FormularioPublicar
          onCerrar={() => setAbierto(false)}
          onPublicar={(p) => { setPropias((prev) => [{ ...p, id: `propia-${Date.now()}` }, ...prev]); setAbierto(false); }}
        />
      )}
    </>
  );
}

// Botón de interés con estado: se puede enviar y deshacer. Todavía no escribe en la cadena.
function BotonInteres({ texto, textoOn, icono, primario }) {
  const [on, setOn] = useState(false);
  return (
    <button type="button" aria-pressed={on} onClick={() => setOn((v) => !v)}
      className={`h-9 px-4 font-label-md text-label-md font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1 ${
        on ? 'bg-secondary-container text-on-secondary-container'
          : primario ? 'bg-primary text-on-primary hover:bg-primary-fixed shadow-sm shadow-primary/20'
            : 'bg-surface-variant hover:bg-surface-bright text-on-surface'
      }`}>
      <Icono nombre={on ? 'check' : icono} tam={18} />
      <span>{on ? textoOn : texto}</span>
    </button>
  );
}

function FormularioPublicar({ onCerrar, onPublicar }) {
  const [tipo, setTipo] = useState('oferta');
  const [monto, setMonto] = useState('');
  const [plazo, setPlazo] = useState('30');
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const tecla = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onCerrar]);

  const enviar = (e) => {
    e.preventDefault();
    const m = Number(monto);
    if (!Number.isFinite(m) || m < 50) return setError('El monto mínimo es Bs 50.');
    if (!(Number(plazo) >= 1)) return setError('Pon un plazo de al menos 1 día.');
    onPublicar({ tipo, monto: m, plazo: Number(plazo), nota: nota.trim() });
  };

  const campo = 'w-full h-11 px-3 rounded-lg bg-surface-container-high text-on-surface border border-surface-variant focus:outline-2 focus:outline-primary';
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4" onClick={onCerrar}>
      <form role="dialog" aria-modal="true" aria-label="Publicar en el Tablón" onClick={(e) => e.stopPropagation()} onSubmit={enviar}
        className="w-full md:max-w-md bg-surface-container rounded-t-2xl md:rounded-2xl p-space-lg shadow-2xl flex flex-col gap-space-sm max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Publicar en el Tablón</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="w-9 h-9 rounded-full hover:bg-surface-container-high flex items-center justify-center">
            <Icono nombre="close" tam={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de publicación">
          {[['oferta', 'Puedo prestar'], ['solicitud', 'Necesito préstamo']].map(([id, t]) => (
            <button key={id} type="button" role="radio" aria-checked={tipo === id} onClick={() => setTipo(id)}
              className={`h-11 rounded-lg font-label-md text-label-md font-semibold transition-colors ${tipo === id ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
              {t}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
          Monto (Bs)
          <input className={campo} type="number" inputMode="numeric" min="50" placeholder="Mínimo 50" value={monto} onChange={(e) => { setMonto(e.target.value); setError(''); }} />
        </label>
        <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
          Plazo (días)
          <input className={campo} type="number" inputMode="numeric" min="1" value={plazo} onChange={(e) => { setPlazo(e.target.value); setError(''); }} />
        </label>
        <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
          Detalle (opcional)
          <textarea className={`${campo} h-20 py-2`} maxLength={160} placeholder="Para qué es y dónde se encuentran" value={nota} onChange={(e) => setNota(e.target.value)} />
        </label>

        {error && <p className="text-error font-body-sm text-body-sm" role="alert">{error}</p>}
        <p className="font-body-sm text-body-sm text-on-surface-variant">El dinero se entrega en persona. Esta publicación es un borrador local: todavía no se registra en la cadena.</p>
        <button type="submit" className="h-12 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg font-bold">Publicar</button>
      </form>
    </div>
  );
}

function TarjetaPropia({ tipo, monto, plazo, nota }) {
  const { direccion } = useAval();
  const quien = direccion ? `${direccion.slice(0, 6)}…${direccion.slice(-4)}` : 'Tú';
  return (
    <div className="relative bg-surface-container rounded-xl p-space-md shadow-md overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary" />
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-on-primary"><Icono nombre="person" tam={22} /></div>
          <div>
            <span className="font-headline-sm text-headline-sm text-on-surface block">{quien}</span>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant">🌱 Nuevo · sin historial</span>
          </div>
        </div>
        <span className="font-metric-mono text-label-sm uppercase px-2 py-0.5 rounded bg-tertiary/20 text-tertiary">Tu publicación</span>
      </div>
      <div className="bg-surface-container-low rounded-lg p-3 space-y-1">
        <span className="font-metric-mono text-label-md text-primary uppercase tracking-wide">{tipo === 'oferta' ? 'Ofrece préstamo' : 'Solicita préstamo'}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold text-on-surface">Bs {monto.toLocaleString('es-BO')}</span>
          <span className="font-metric-mono text-body-sm text-on-surface-variant">/ {plazo} días</span>
        </div>
        {nota && <p className="font-body-sm text-body-sm text-on-surface-variant">{nota}</p>}
      </div>
      <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">Borrador local · aún no está en la cadena</p>
    </div>
  );
}

function Cabecera({ foto, nombre, insignia, href, children }) {
  return (
    <div className="flex items-start justify-between gap-2 mb-3">
      <Link href={href} aria-label={`Ver perfil de ${nombre}`} className="flex items-center gap-2.5 min-w-0 hover:opacity-90">
        <div className="relative">
          <img src={foto} alt={nombre} className="w-11 h-11 rounded-full object-cover bg-surface-container-highest" />
          {insignia}
        </div>
        {children[0]}
      </Link>
      <div className="text-right">{children[1]}</div>
    </div>
  );
}

function TarjetaAlan() {
  return (
    <div className="relative bg-surface-container rounded-xl p-space-md shadow-xl overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
      <Cabecera foto="/img/alan-m.jpg" nombre="Alan M." href="/perfil/alan"
        insignia={<span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-primary ring-2 ring-surface-container" />}>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Alan M.</span>
            <Icono nombre="verified" tam={17} relleno className="text-primary" />
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">⭐ Muy cumplido</span>
          </div>
        </div>
        <>
          <span className="font-metric-mono text-label-sm uppercase text-on-surface-variant block">Honor Score</span>
          <div className="flex items-center justify-end gap-1 text-primary">
            <Icono nombre="speed" tam={16} />
            <span className="font-metric-mono text-headline-sm font-bold">860</span>
          </div>
        </>
      </Cabecera>

      <div className="bg-surface-container-low rounded-lg p-3 my-2 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="font-metric-mono text-label-md text-primary uppercase tracking-wide">Ofrece préstamo</span>
          <span className="font-metric-mono text-label-sm text-secondary">Cochabamba, La Cancha</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold text-on-surface tracking-tight">Bs 2,000</span>
          <span className="font-metric-mono text-body-sm text-on-surface-variant">/ 30 días plazo</span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Para comerciantes del rubro abarrotes o confección. Trato en persona con doble firma en QR.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 my-3 text-center">
        <div className="bg-surface-container-high/60 rounded-lg py-1.5 px-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant block">Cumplimiento</span>
          <span className="font-metric-mono text-label-md text-primary font-semibold">94% a tiempo</span>
        </div>
        <div className="bg-surface-container-high/60 rounded-lg py-1.5 px-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant block">Tratos cerrados</span>
          <span className="font-metric-mono text-label-md text-on-surface font-semibold">18 personas</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-surface-variant/40">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 overflow-hidden">
            {['mini-artesana', 'mini-vendedor', 'mini-tendero'].map((f) => (
              <img key={f} src={`/img/${f}.jpg`} alt="" className="inline-block h-6 w-6 rounded-full object-cover ring-2 ring-surface-container" />
            ))}
          </div>
          <span className="font-label-sm text-label-sm font-semibold text-primary">3 interesados</span>
        </div>
        <Link href="/tablon/interesados" className="h-9 px-3 bg-secondary-container hover:bg-secondary-container/80 text-on-secondary-container font-label-md text-label-md rounded-lg flex items-center gap-1 transition-colors">
          <span>Ver interesados y comparar</span>
          <Icono nombre="chevron_right" tam={16} />
        </Link>
      </div>
    </div>
  );
}

function TarjetaJose() {
  return (
    <div className="relative bg-surface-container rounded-xl p-space-md shadow-md">
      <Cabecera foto="/img/jose-r.jpg" nombre="José R." href="/perfil/jose">
        <div>
          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">José R.</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant">🤝 Cumplido</span>
          </div>
        </div>
        <>
          <span className="font-metric-mono text-label-sm uppercase text-on-surface-variant block">Score</span>
          <span className="font-metric-mono text-headline-sm font-bold text-secondary">740</span>
        </>
      </Cabecera>

      <div className="bg-surface-container-low rounded-lg p-3 my-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-metric-mono text-label-sm text-secondary uppercase">Solicitud urgente</span>
          <span className="font-metric-mono text-label-sm text-on-surface-variant">Hace 2 horas</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">Bs 800</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">para mercadería</span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Reposición de insumos de feria sábado. Retorno pactado en 10 días hábiles con interés acordado.</p>
      </div>

      <div className="flex items-center gap-2 py-1 text-on-surface-variant">
        <span className="font-metric-mono text-label-sm bg-surface-container-high px-2 py-0.5 rounded text-primary">100% a tiempo</span>
        <span className="font-metric-mono text-label-sm bg-surface-container-high px-2 py-0.5 rounded">4 tratos concluidos</span>
      </div>

      <div className="pt-3 mt-1 flex items-center justify-between">
        <div className="flex items-center gap-1 text-on-surface-variant">
          <Icono nombre="pin_drop" tam={16} className="text-primary" />
          <span className="font-label-sm text-label-sm">Quillacollo centro</span>
        </div>
        <BotonInteres texto="Me interesa" textoOn="Interés enviado" icono="handshake" primario />
      </div>
    </div>
  );
}

function TarjetaBrenda() {
  return (
    <div className="relative bg-surface-container rounded-xl p-space-md shadow-md overflow-hidden">
      <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-tertiary/10 rounded-full blur-xl pointer-events-none" />
      <Cabecera foto="/img/brenda-c.jpg" nombre="Brenda C." href="/perfil/brenda"
        insignia={
          <span className="absolute -bottom-1 -right-1 bg-surface-container-lowest rounded-full p-0.5 flex">
            <Icono nombre="workspace_premium" tam={14} className="text-tertiary" />
          </span>
        }>
        <div>
          <div className="flex items-center gap-1">
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Brenda C.</span>
            <Icono nombre="verified_user" tam={16} className="text-tertiary" />
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-container/60 text-secondary">🏆 Palabra de oro</span>
          </div>
        </div>
        <>
          <span className="font-metric-mono text-label-sm uppercase text-on-surface-variant block">Score Máximo</span>
          <span className="font-metric-mono text-headline-sm font-bold text-tertiary">965</span>
        </>
      </Cabecera>

      <div className="bg-surface-container-low rounded-lg p-3 my-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-metric-mono text-label-sm text-tertiary uppercase tracking-wide">Microcrédito Exprés</span>
          <span className="font-metric-mono text-label-sm text-primary flex items-center gap-1">
            <Icono nombre="verified" tam={13} />0 disputas
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">Bs 1,000</span>
          <span className="font-metric-mono text-body-sm text-on-surface-variant">(15 días)</span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Fondos listos para entrega presencial. Prioridad a participantes con score mayor a 600.</p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="inline-flex items-center gap-1 bg-surface-container-high/80 px-2 py-1 rounded-md">
          <Icono nombre="neurology" tam={14} className="text-tertiary" />
          <span className="font-metric-mono text-label-sm text-on-surface">Auditado por Qwen ERC-8004</span>
        </div>
        <BotonInteres texto="Postular" textoOn="Postulación enviada" icono="arrow_outward" />
      </div>
    </div>
  );
}
