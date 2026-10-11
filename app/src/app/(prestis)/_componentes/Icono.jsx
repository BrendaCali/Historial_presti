// El tamaño va inline: la hoja de Material Symbols fija font-size: 24px fuera de las capas de Tailwind.
export default function Icono({ nombre, tam = 24, relleno = false, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: tam, fontVariationSettings: relleno ? "'FILL' 1" : undefined }}
    >
      {nombre}
    </span>
  );
}
