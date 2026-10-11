'use client';

import Link from 'next/link';
import { useAval } from '../../AvalProvider';
import Icono from './Icono';

// Las pantallas internas solo se muestran con la sesión abierta. Al recargar la página la sesión se pierde (la clave
// vive solo en memoria): este es el comportamiento esperado de la prueba stateless, y desde aquí se vuelve a entrar.
export default function GuardiaSesion({ children }) {
  const { fase, entrar, ocupado, modo, necesitaPrueba, aviso } = useAval();

  if (fase === 'in') return children;

  const trabajando = fase === 'working' || ocupado === 'enter';
  return (
    <main className="flex-1 flex items-center justify-center p-space-lg">
      <div className="w-full max-w-sm bg-surface-container rounded-2xl p-space-xl text-center flex flex-col items-center gap-space-md shadow-xl">
        <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
          <Icono nombre="fingerprint" tam={30} />
        </div>
        <h1 className="font-headline-sm text-headline-sm text-on-surface">{fase === 'locked' ? 'Sesión bloqueada' : 'Continúa con tu huella'}</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Tu clave no se guarda en el navegador. Con tu huella se reconstruye tu cuenta y todo su estado desde la cadena.
        </p>
        <button type="button" disabled={trabajando} onClick={() => entrar(modo)}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary-fixed-dim disabled:opacity-60 text-on-primary font-label-lg text-label-lg font-bold">
          {trabajando ? 'Esperando tu huella…' : 'Continuar con huella'}
        </button>
        {necesitaPrueba && (
          <button type="button" onClick={() => entrar('simulated')}
            className="w-full h-11 rounded-xl bg-surface-container-high text-on-surface font-label-md text-label-md">
            Entrar con mi cuenta de prueba
          </button>
        )}
        {aviso?.tipo === 'error' && <p role="alert" className="text-error font-body-sm text-body-sm">{aviso.texto}</p>}
        <Link href="/" className="font-label-md text-label-md text-primary hover:underline">Crear una cuenta nueva</Link>
      </div>
    </main>
  );
}
