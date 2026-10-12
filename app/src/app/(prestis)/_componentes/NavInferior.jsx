'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { bs } from '../../../lib/formato';
import { useAval } from '../../AvalProvider';
import Icono from './Icono';
import { useVista } from './useMercado';

// Dos grupos: los préstamos entre personas, y el asistente con los pagos autorizados (Aval).
const PRESTAMOS = [
  { href: '/tablon', icono: 'dashboard', texto: 'Tablón', aqui: ['/tablon'] },
  { href: '/mis-tratos', icono: 'handshake', texto: 'Mis tratos', aqui: ['/mis-tratos', '/tratos'] },
  { href: '/billetera', icono: 'account_balance_wallet', texto: 'Billetera', aqui: ['/billetera'] },
  { href: '/mi-codigo', icono: 'qr_code_2', texto: 'Mi código', aqui: ['/mi-codigo'] },
  { href: '/reputacion', icono: 'verified', texto: 'Mi perfil', aqui: ['/reputacion', '/perfil'] },
];
const ASISTENTE = [
  { href: '/asistente', icono: 'smart_toy', texto: 'Asistente', aqui: ['/asistente'] },
  { href: '/permiso', icono: 'shield_person', texto: 'Permiso de pagos', aqui: ['/permiso'] },
  { href: '/aprobaciones', icono: 'fingerprint', texto: 'Aprobar pagos', aqui: ['/aprobaciones'] },
  { href: '/actividad', icono: 'receipt_long', texto: 'Actividad', aqui: ['/actividad'] },
];
const CELULAR = [
  PRESTAMOS[0], PRESTAMOS[1], PRESTAMOS[2], ASISTENTE[0],
  { href: '/reputacion', icono: 'person', texto: 'Perfil', aqui: ['/reputacion', '/perfil', '/mi-codigo', '/permiso', '/aprobaciones', '/actividad'] },
];

// Cuántos tratos esperan algo de esta persona (aceptar, desembolsar o abonar).
const cuantosPendientes = (tratos, yo) => (tratos ?? []).filter((t) => (
  (t.estado === 'propuesto' && !t.acepta[yo]) || (t.estado === 'aceptado' && t.miRol === 'prestamista') || (t.estado === 'activo' && t.miRol === 'prestatario')
)).length;

export default function NavInferior() {
  const ruta = usePathname();
  const { direccion, pendientes: aprobaciones, datos } = useAval();
  const { datos: cuenta } = useVista('ver-cuenta', {}, 15000);
  const { datos: tratos } = useVista('ver-tratos', {}, 15000);
  const activo = (s) => s.aqui.some((p) => ruta.startsWith(p));
  const porHacer = cuantosPendientes(tratos, (direccion ?? '').toLowerCase());
  const insignia = (href) => (href === '/mis-tratos' ? porHacer : href === '/aprobaciones' ? aprobaciones.length : 0);

  const Item = ({ s, lateral }) => {
    const n = insignia(s.href);
    return (
      <Link href={s.href} aria-current={activo(s) ? 'page' : undefined}
        className={lateral
          ? `relative h-11 px-space-md rounded-xl flex items-center gap-space-sm font-label-lg text-label-lg transition-colors ${activo(s) ? 'bg-secondary-container/50 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`
          : `flex flex-col items-center justify-center flex-1 h-full min-w-[44px] min-h-[44px] transition-colors ${activo(s) ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
        {lateral ? (
          <>
            <Icono nombre={s.icono} tam={22} relleno={activo(s)} />
            {s.texto}
            {n > 0 && <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-error text-on-error font-metric-mono text-label-sm flex items-center justify-center">{n}</span>}
          </>
        ) : (
          <>
            <div className={`relative w-10 h-7 rounded-full flex items-center justify-center transition-colors ${activo(s) ? 'bg-secondary-container/50' : ''}`}>
              <Icono nombre={s.icono} tam={20} relleno={activo(s)} />
              {n > 0 && <span className="absolute -top-0.5 -right-1 min-w-4 h-4 px-1 rounded-full bg-error text-on-error font-metric-mono text-[10px] flex items-center justify-center">{n}</span>}
            </div>
            <span className="font-label-sm text-label-sm mt-0.5">{s.texto}</span>
          </>
        )}
      </Link>
    );
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-8px_24px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-around h-16 px-space-xs max-w-md mx-auto">{CELULAR.map((s) => <Item key={s.texto} s={s} />)}</div>
      </nav>

      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 z-40 flex-col bg-surface-container-lowest border-r border-surface-variant/40 p-space-md overflow-y-auto">
        <Link href="/tablon" className="flex items-center gap-space-sm px-space-xs py-space-md">
          <img src="/img/logo-condor.png" alt="Preste" className="h-10 w-auto object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="font-headline-sm text-headline-sm text-on-surface">Preste</span>
            <span className="font-metric-mono text-label-sm text-secondary uppercase">préstamos con reputación</span>
          </div>
        </Link>
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider px-space-md mt-space-sm">Préstamos</span>
        <nav className="flex flex-col gap-1 mt-1">{PRESTAMOS.map((s) => <Item key={s.texto} s={s} lateral />)}</nav>
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider px-space-md mt-space-md">Asistente y pagos (Aval)</span>
        <nav className="flex flex-col gap-1 mt-1">{ASISTENTE.map((s) => <Item key={s.texto} s={s} lateral />)}</nav>
        <div className="mt-auto rounded-xl bg-surface-container p-space-md flex flex-col gap-1">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Tu billetera</span>
          <span className="font-headline-sm text-headline-sm text-primary">{cuenta ? bs(cuenta.saldo) : '…'}</span>
          {direccion && <span className="font-metric-mono text-label-sm text-on-surface-variant break-all">{direccion.slice(0, 8)}…{direccion.slice(-6)}</span>}
          {datos && <span className="font-metric-mono text-label-sm text-on-surface-variant">{String(datos.saldo / 1_000_000n)} tUSD (Aval)</span>}
        </div>
      </aside>
    </>
  );
}
