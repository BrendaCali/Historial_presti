// Vacía el estado de PRODUCCIÓN del mercado (ofertas, tratos, saldos, calificaciones) en Vercel Blob.
// Úsalo justo antes de grabar o entregar, para que la demo empiece limpia. NO toca la cadena ni las cuentas.
//   node scripts/vaciar-produccion.mjs           -> muestra qué borraría (no borra nada)
//   node scripts/vaciar-produccion.mjs --borrar  -> borra el documento estado/production.json
import fs from 'node:fs';
import { del, head } from '@vercel/blob';

const linea = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').find((l) => l.startsWith('BLOB_READ_WRITE_TOKEN='));
if (!linea) throw new Error('No hay BLOB_READ_WRITE_TOKEN en app/.env.local');
process.env.BLOB_READ_WRITE_TOKEN = linea.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '');

const RUTA = 'estado/production.json';
const info = await head(RUTA).catch(() => null);
if (!info) { console.log('No hay estado de producción: ya está vacío.'); process.exit(0); }
console.log(`Estado de producción: ${info.size} bytes, actualizado ${info.uploadedAt.toISOString()}`);
if (!process.argv.includes('--borrar')) { console.log('Prueba en seco: no se borró nada. Usa --borrar para vaciarlo.'); process.exit(0); }
await del(RUTA);
console.log('Listo: el mercado de producción quedó vacío.');
