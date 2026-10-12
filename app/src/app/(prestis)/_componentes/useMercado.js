'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAval } from '../../AvalProvider';

// Lee una vista del mercado (firmada con la cuenta) y la refresca sola cada pocos segundos mientras la sesión está abierta.
export function useVista(accion, datos = {}, intervalo = 8000) {
  const { mercado, fase } = useAval();
  const [estado, setEstado] = useState({ datos: null, error: '', cargando: true });
  const clave = JSON.stringify(datos);
  const viva = useRef(true);

  const cargar = useCallback(async () => {
    try {
      const d = await mercado(accion, JSON.parse(clave));
      if (viva.current) setEstado({ datos: d, error: '', cargando: false });
    } catch (e) {
      if (viva.current) setEstado((s) => ({ ...s, error: e.message, cargando: false }));
    }
  }, [mercado, accion, clave]);

  useEffect(() => {
    viva.current = true;
    if (fase !== 'in') return undefined;
    cargar();
    const id = setInterval(cargar, intervalo);
    return () => { viva.current = false; clearInterval(id); };
  }, [fase, cargar, intervalo]);

  return { ...estado, recargar: cargar };
}

// Ejecuta una acción que cambia algo (publicar, aceptar, desembolsar…): evita dobles toques y muestra el resultado.
export function useAccion(alTerminar) {
  const { mercado, avisar } = useAval();
  const [ocupado, setOcupado] = useState(null);

  const ejecutar = useCallback(async (nombre, accion, datos, mensajeOk) => {
    if (ocupado) return null;
    setOcupado(nombre);
    try {
      const r = await mercado(accion, datos);
      if (mensajeOk) avisar('ok', mensajeOk);
      await alTerminar?.(r);
      return r;
    } catch (e) {
      avisar('error', e.message);
      return null;
    } finally {
      setOcupado(null);
    }
  }, [mercado, avisar, ocupado, alTerminar]);

  return { ocupado, ejecutar };
}
