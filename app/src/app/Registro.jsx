'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAval } from './AvalProvider';

const ESTADO = { pending: '', doing: ' activo', done: ' hecho', skipped: ' hecho', error: ' error' };

// Inicio solo con huella. Con Aval, una sola ceremonia de passkey (Mera) crea la cuenta, el relayer le da saldo de
// prueba y registra la clave P256 de la huella para poder aprobar pagos. El usuario no necesita MON.
export default function Registro() {
  const router = useRouter();
  const { fase, pasos, empezar, entrar, reintentar, ocupado, necesitaPrueba, errorInicio, metricas, direccion, datos, usd } = useAval();
  const trabajando = ocupado === 'start' || ocupado === 'enter' || ocupado === 'retry';
  const huboError = pasos.some((p) => p.state === 'error');

  // Al terminar, la cuenta se suscribe al webhook de Alchemy (si el servidor lo tiene configurado).
  useEffect(() => {
    if (fase === 'in' && direccion) {
      fetch('/api/avisos/suscribir', { method: 'POST', body: JSON.stringify({ direccion }) }).catch(() => {});
    }
  }, [fase, direccion]);

  return (
    <main className="auth">
      <section className="auth-lado">
        <div className="logo">preste</div>
        <div>
          <span className="etiqueta">Tu palabra ahora tiene historial</span>
          <h1>Tus préstamos, con reputación que nadie borra.</h1>
          <p>Registra los préstamos que haces en persona, arma un historial verificable y paga tus cuotas con un asistente que respeta tus límites.</p>
          <div className="pasos" aria-live="polite">
            {pasos.map((p, i) => (
              <div key={p.id} className={`paso${ESTADO[p.state]}${fase === 'out' && i === 0 ? ' activo' : ''}`}>
                <b>{p.state === 'done' || p.state === 'skipped' ? '✓' : p.state === 'error' ? '!' : i + 1}</b>
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="auth-form">
        <div className="form-caja">
          {fase !== 'in' ? (
            <>
              <h2>Entra con tu huella</h2>
              <p className="sub">Tu huella es tu llave. Sin contraseñas ni frases semilla, y sin necesitar MON: el dinero es de prueba, en Monad testnet.</p>
              <button className="boton" disabled={trabajando} onClick={() => empezar('real')}>
                {trabajando ? 'Preparando tu cuenta…' : 'Crear cuenta con mi huella'}
              </button>
              <button className="boton sec" disabled={trabajando} onClick={() => entrar('real')}>Ya tengo cuenta: entrar con mi huella</button>
              {fase === 'working' && !trabajando && (
                <button className="boton sec" onClick={reintentar}>Reintentar los pasos pendientes</button>
              )}
              {errorInicio && <p className="error" role="alert">{errorInicio}</p>}

              <details className="prueba" open={necesitaPrueba}>
                <summary>¿No puedes usar passkeys? Probar la app sin ellas</summary>
                <p>
                  Guarda una clave de software en este navegador solo para que veas la app. <b>No es una passkey real</b>: no protege tu
                  cuenta ni se recupera en otro dispositivo.
                </p>
                <button className="boton sec" disabled={trabajando} onClick={() => empezar('simulated')}>Probar sin passkey</button>
                <button className="boton sec" disabled={trabajando} onClick={() => entrar('simulated')}>Volver a mi prueba</button>
              </details>
              <p className="aviso">Con la misma huella recuperas tu cuenta en cualquier dispositivo. No guardamos tu clave en el navegador.</p>
            </>
          ) : (
            <>
              <h2>Cuenta lista</h2>
              <p className="sub">Se creó desde tu huella y ya está registrada en Monad.</p>
              <div className="dato"><span>Dirección en Monad</span><code>{direccion}</code></div>
              <div className="dato"><span>Saldo de prueba</span><code>{datos ? `${usd(datos.saldo)} tUSD` : 'consultando…'}</code></div>
              <div className="dato"><span>Huella registrada para aprobar pagos</span><code>{datos?.p256 ? 'sí (clave P256 en la cadena)' : 'no'}</code></div>
              {metricas.listoMs !== null && (
                <div className="dato"><span>Tiempo hasta tener la cuenta lista</span><code>{(metricas.listoMs / 1000).toFixed(1)} s · {metricas.huellasHastaListo} verificación(es) de huella</code></div>
              )}
              <button className="boton" onClick={() => router.push('/tablon')}>Ir al Tablón</button>
              <button className="boton sec" onClick={() => router.push('/asistente')}>Ir a mi asistente de pagos</button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
