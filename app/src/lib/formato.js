import { REGLAS } from './mercado/logica';

// Dinero: la app guarda centavos de Bs de prueba. Aquí solo se muestra.
export const bs = (c) => `Bs ${(c / 100).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const usdAprox = (c) => `≈ US$ ${(c / 100 / REGLAS.TIPO_CAMBIO_BOB_POR_USD).toFixed(2)}`;
export const corta = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—');
export const fecha = (ms) => new Date(ms).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
export const dia = (ms) => new Date(ms).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
export const aCentavos = (texto) => {
  const n = Number(String(texto).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
};
export const estrellas = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
export const ESTADOS_TRATO = {
  propuesto: { texto: 'Esperando aceptación', color: 'bg-tertiary/20 text-tertiary' },
  aceptado: { texto: 'Aceptado · falta el desembolso', color: 'bg-secondary-container text-on-secondary-container' },
  activo: { texto: 'Activo', color: 'bg-primary-container/20 text-primary' },
  pagado: { texto: 'Pagado', color: 'bg-primary text-on-primary' },
  cancelado: { texto: 'Cancelado', color: 'bg-surface-variant text-on-surface-variant' },
};
