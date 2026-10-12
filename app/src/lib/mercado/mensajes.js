// Mensajes que se firman (los comparten el navegador y el servidor). Solo texto: sin dependencias.
// Petición: liga la acción, la cuenta, la hora, un nonce de un solo uso y el contenido exacto (por su hash).
export const mensajePeticion = ({ accion, addr, ts, nonce, hashCuerpo }) =>
  `preste:v1|${accion}|${String(addr).toLowerCase()}|${ts}|${nonce}|${hashCuerpo}`;

// Código QR de calificación: lo firma quien lo muestra. Cambia cada 30 s; el servidor lo acepta hasta 2 minutos.
export const mensajeQR = ({ a, t, n }) => `preste:qr:v1|${String(a).toLowerCase()}|${t}|${n}`;
