'use client';

// ATRIBUCIÓN: la lógica de cuenta, permisos y aprobaciones sigue el hook useAval de apps/demo de Aval
// (github.com/Alan021011/Aval, de Alan Meneces), portado a JavaScript y reescrito para Preste.

import { isMeraError } from '@category-labs/mera';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createWalletClient } from 'viem';
import { AvalError, createAval, createRelayerClient } from '../vendor/aval-sdk/index.js';
import { RELAYER_BASE, SESSION_MINUTES, monad, publicClient, transport, usd } from '../lib/aval/config';
import { forgetSimulatedAccount, realBackend, simulatedBackend } from '../lib/aval/passkey';
import { createAccount, signIn } from '../lib/aval/session';

// Estado de Preste sobre Aval. TODO lo que se muestra del usuario se lee de la cadena (permisos, pedidos, recibos,
// reputación): nada de eso se guarda en el navegador. La sesión de firma vive solo en memoria.

const Ctx = createContext(null);
export const useAval = () => useContext(Ctx);

const PASOS = [
  { id: 'account', label: 'Creamos tu cuenta con una huella', state: 'pending' },
  { id: 'funds', label: 'Te damos saldo de prueba', state: 'pending' },
  { id: 'key', label: 'Activamos tu firma de aprobación', state: 'pending' },
];

const NUNCA = (1n << 128n) - 1n;
export const sinUmbral = (umbral) => umbral >= NUNCA;
export const permisoActivo = (permit, ahora = Date.now()) =>
  !permit.revoked && permit.terms.expiresAt > BigInt(Math.floor(ahora / 1000)) && permit.spent < permit.terms.maxTotal;

export function errorAmable(error) {
  if (isMeraError(error) && error.code === 'PRF_UNAVAILABLE') {
    return 'Tu dispositivo o navegador no entrega la clave de la passkey (PRF). Prueba con Chrome y las contraseñas de Google, iCloud Keychain o 1Password, o usa el modo de prueba.';
  }
  if (error instanceof AvalError && error.code === 'RelayerLowBalance') {
    return 'El servicio que paga el gas por ti (el relayer de Aval) se quedó sin fondos. Avisa a Alan para que lo recargue y vuelve a intentar.';
  }
  if (error instanceof AvalError && error.code === 'DailyLimitReached') {
    return 'El relayer de Aval alcanzó su límite diario. Inténtalo más tarde.';
  }
  if (error instanceof AvalError) return error.message;
  if (typeof DOMException !== 'undefined' && error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError')) {
    return 'Se canceló la verificación con tu huella.';
  }
  if (error instanceof Error) return error.message;
  return 'Algo salió mal. Inténtalo de nuevo.';
}

export default function AvalProvider({ children }) {
  const relayer = useMemo(() => createRelayerClient({ url: RELAYER_BASE }), []);
  const lector = useMemo(() => createAval({ publicClient }), []);

  const [fase, setFase] = useState('out'); // out | working | in | locked
  const [modo, setModo] = useState('real');
  const [pasos, setPasos] = useState(PASOS);
  const [direccion, setDireccion] = useState(null);
  const [datos, setDatos] = useState(null); // lo leído de la cadena
  const [aviso, setAviso] = useState(null);
  const [ocupado, setOcupado] = useState(null);
  const [bloqueaEn, setBloqueaEn] = useState(null);
  const [necesitaPrueba, setNecesitaPrueba] = useState(false);
  const [metricas, setMetricas] = useState({ primeraTxMs: null, listoMs: null, huellasHastaListo: null });
  const [historial, setHistorial] = useState([]);
  const [errorInicio, setErrorInicio] = useState('');

  const backend = useRef(null);
  const sesion = useRef(null);
  const aval = useRef(null);
  const claveP256 = useRef(null);
  const inicio = useRef(0);
  const ids = useRef(0);
  const temporizadorAviso = useRef(undefined);

  const avisar = useCallback((tipo, texto) => {
    clearTimeout(temporizadorAviso.current);
    setAviso({ id: ++ids.current, tipo, texto });
    temporizadorAviso.current = setTimeout(() => setAviso(null), tipo === 'error' ? 9000 : 5000);
  }, []);

  const anotar = useCallback((titulo, extra = {}) => {
    setHistorial((viejo) => [{ id: ++ids.current, at: Date.now(), titulo, ...extra }, ...viejo].slice(0, 100));
  }, []);

  // Error del inicio: se queda en pantalla hasta el siguiente intento, para que se pueda leer y reintentar.
  const fallar = useCallback((e) => {
    const m = errorAmable(e);
    setErrorInicio(m);
    avisar('error', m);
  }, [avisar]);

  const tocar = useCallback(() => setBloqueaEn(Date.now() + SESSION_MINUTES * 60_000), []);

  // Ejecuta una llamada al relayer, la registra con su tiempo y cuenta la primera transacción.
  const medir = useCallback(async (titulo, fn) => {
    const t0 = performance.now();
    const resultado = await fn();
    anotar(titulo, { hash: resultado?.hash, ms: performance.now() - t0 });
    setMetricas((m) => (m.primeraTxMs === null && inicio.current ? { ...m, primeraTxMs: performance.now() - inicio.current } : m));
    return resultado;
  }, [anotar]);

  const cargar = useCallback(async (dueño) => {
    const agente = await relayer.agent.info();
    const [saldo, permisos, pedidos, recibos, reputacion, p256] = await Promise.all([
      lector.tokens.balanceOf(dueño),
      lector.permits.listByOwner(dueño),
      lector.permits.requestsOf(dueño),
      lector.permits.receiptsOf(dueño),
      lector.reputation.summary(agente.service.agentId, { tag1: 'calidad' }),
      lector.passkeys.keyOf(dueño),
    ]);
    return { saldo, permisos, pedidos, recibos, reputacion, agente, p256, at: Date.now() };
  }, [lector, relayer]);

  const refrescar = useCallback(async () => {
    const dueño = sesion.current?.address ?? direccion;
    if (!dueño) return;
    setDatos(await cargar(dueño));
  }, [cargar, direccion]);

  const atar = (nueva, actual) => {
    sesion.current?.end();
    sesion.current = nueva;
    backend.current = actual;
    aval.current = createAval({
      publicClient,
      walletClient: createWalletClient({ account: nueva.account, chain: monad, transport }),
      assertionProvider: actual.assertionProvider,
    });
    setDireccion(nueva.address);
    tocar();
  };

  const asegurar = () => {
    if (!aval.current || !sesion.current) throw new Error('La sesión está bloqueada. Usa tu huella para continuar.');
    return aval.current;
  };

  const marcar = (id, state) => setPasos((viejo) => viejo.map((p) => (p.id === id ? { ...p, state } : p)));

  // Pasos que se pueden repetir sin riesgo: cada uno comprueba primero si ya está hecho.
  const preparar = useCallback(async () => {
    const a = asegurar();
    const dueño = sesion.current.address;

    marcar('funds', 'doing');
    if ((await lector.tokens.balanceOf(dueño)) === 0n) {
      try {
        await medir('Saldo de prueba (faucet)', () => relayer.faucet(dueño));
        marcar('funds', 'done');
      } catch (e) {
        if (e instanceof AvalError && e.code === 'RateLimited') {
          marcar('funds', 'skipped');
          avisar('info', 'El faucet ya entregó saldo desde esta red hace poco. Puedes pedirlo de nuevo más tarde.');
        } else {
          marcar('funds', 'error');
          throw e;
        }
      }
    } else {
      marcar('funds', 'done');
    }

    marcar('key', 'doing');
    if (!(await lector.passkeys.has(dueño))) {
      const clave = claveP256.current;
      if (!clave) throw new Error('Esta cuenta no terminó de registrar su huella. Crea una cuenta nueva.');
      await medir('Registrar clave de la huella (P256)', async () => relayer.register(await a.passkeys.signRegister(clave)));
    }
    marcar('key', 'done');
  }, [avisar, lector, medir, relayer]);

  const empezar = useCallback(async (tipo) => {
    if (ocupado) return;
    setOcupado('start');
    setErrorInicio('');
    setNecesitaPrueba(false);
    setPasos(PASOS.map((p) => ({ ...p })));
    setModo(tipo);
    setFase('working');
    inicio.current = performance.now();
    setMetricas({ primeraTxMs: null, listoMs: null, huellasHastaListo: null });
    const actual = tipo === 'real' ? realBackend() : simulatedBackend();
    try {
      marcar('account', 'doing');
      const { session: creada, publicKey } = await createAccount(actual, `preste-${Date.now().toString(36)}`);
      claveP256.current = publicKey;
      atar(creada, actual);
      marcar('account', 'done');
      await preparar();
      await refrescar();
      setMetricas((m) => ({ ...m, listoMs: performance.now() - inicio.current, huellasHastaListo: backend.current?.prompts() ?? null }));
      setFase('in');
    } catch (e) {
      if (isMeraError(e) && e.code === 'PRF_UNAVAILABLE') setNecesitaPrueba(true);
      setPasos((viejo) => viejo.map((p) => (p.state === 'doing' ? { ...p, state: 'error' } : p)));
      fallar(e);
      if (!sesion.current) setFase('out');
    } finally {
      setOcupado(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocupado, fallar, preparar, refrescar]);

  const reintentar = useCallback(async () => {
    if (ocupado || !sesion.current) return;
    setOcupado('retry');
    setErrorInicio('');
    try {
      await preparar();
      await refrescar();
      setMetricas((m) => ({ ...m, listoMs: performance.now() - inicio.current, huellasHastaListo: backend.current?.prompts() ?? null }));
      setFase('in');
    } catch (e) {
      setPasos((viejo) => viejo.map((p) => (p.state === 'doing' ? { ...p, state: 'error' } : p)));
      fallar(e);
    } finally {
      setOcupado(null);
    }
  }, [ocupado, fallar, preparar, refrescar]);

  const entrar = useCallback(async (tipo) => {
    if (ocupado) return;
    setOcupado('enter');
    setErrorInicio('');
    setNecesitaPrueba(false);
    setModo(tipo);
    inicio.current = performance.now();
    const actual = backend.current?.mode === tipo ? backend.current : tipo === 'real' ? realBackend() : simulatedBackend();
    const antes = actual.prompts();
    try {
      const abierta = await signIn(actual);
      const cambio = sesion.current && sesion.current.address !== abierta.address;
      atar(abierta, actual);
      if (cambio) setDatos(null);
      setDatos(await cargar(abierta.address));
      setMetricas((m) => ({ ...m, listoMs: performance.now() - inicio.current, huellasHastaListo: actual.prompts() - antes }));
      setFase('in');
      anotar('Sesión abierta con la huella: estado reconstruido desde la cadena');
    } catch (e) {
      if (isMeraError(e) && e.code === 'PRF_UNAVAILABLE') setNecesitaPrueba(true);
      fallar(e);
    } finally {
      setOcupado(null);
    }
  }, [ocupado, anotar, fallar, cargar]);

  // Bloquea la sesión: la clave sale de la memoria y hay que volver a usar la huella.
  const bloquear = useCallback((motivo) => {
    sesion.current?.end();
    sesion.current = null;
    aval.current = null;
    setBloqueaEn(null);
    setFase((f) => (f === 'in' ? 'locked' : f));
    if (motivo) avisar('info', motivo);
    anotar(motivo ?? 'Sesión bloqueada');
  }, [anotar, avisar]);

  // Simula abrir la app en un dispositivo nuevo (prueba stateless): borra todo lo local.
  const olvidar = useCallback(() => {
    sesion.current?.end();
    sesion.current = null;
    aval.current = null;
    backend.current = null;
    claveP256.current = null;
    forgetSimulatedAccount();
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // sin almacenamiento disponible
    }
    setDatos(null);
    setDireccion(null);
    setHistorial([]);
    setBloqueaEn(null);
    setMetricas({ primeraTxMs: null, listoMs: null, huellasHastaListo: null });
    setFase('out');
    avisar('info', 'Datos locales borrados. Entra con tu huella: todo se reconstruye desde la cadena.');
  }, [avisar]);

  // Bloqueo automático por inactividad.
  useEffect(() => {
    if (!bloqueaEn) return;
    const id = setInterval(() => {
      if (Date.now() >= bloqueaEn) bloquear(`Sesión bloqueada tras ${SESSION_MINUTES} minutos sin actividad.`);
    }, 5000);
    return () => clearInterval(id);
  }, [bloqueaEn, bloquear]);

  // Envuelve una acción del usuario: evita dobles toques, renueva la sesión y traduce los errores.
  const actuar = useCallback(async (nombre, fn) => {
    if (ocupado) return;
    setOcupado(nombre);
    try {
      asegurar();
      await fn();
      tocar();
    } catch (e) {
      avisar('error', errorAmable(e));
    } finally {
      setOcupado(null);
    }
  }, [ocupado, avisar, tocar]);

  const permisoActual = useMemo(() => {
    if (!datos) return null;
    const mios = datos.permisos.filter((p) => p.permit.terms.agent.toLowerCase() === datos.agente.address.toLowerCase());
    return [...mios].reverse().find((p) => permisoActivo(p.permit)) ?? null;
  }, [datos]);

  const pendientes = useMemo(() => {
    if (!datos) return [];
    return datos.pedidos
      .filter((r) => r.request.status === 1)
      .filter((r) => datos.permisos.some((p) => p.permitId === r.request.permitId && permisoActivo(p.permit)))
      .reverse();
  }, [datos]);

  const crearPermiso = useCallback((form) => actuar('permit', async () => {
    const a = asegurar();
    const agente = datos.agente;
    // El usuario firma sin ventanas (la sesión ya está abierta) y el relayer envía.
    await medir('Autorizar el gasto del token', async () => relayer.tokenPermit(await a.tokens.signPermit({ value: form.total })));
    const { permitId } = await medir('Crear permiso para el agente', async () =>
      relayer.grant(await a.permits.signGrant({
        agent: agente.address,
        maxPerSpend: form.porPago,
        maxTotal: form.total,
        approvalThreshold: form.umbral >= form.porPago ? null : form.umbral,
        expiresIn: form.horas * 3600,
        recipients: [agente.service.address],
      })),
    );
    await refrescar();
    avisar('ok', `Permiso #${permitId} creado. Tu agente ya puede actuar dentro de esos límites.`);
  }), [actuar, avisar, datos, medir, refrescar, relayer]);

  const revocarPermiso = useCallback((permitId) => actuar('revoke', async () => {
    const a = asegurar();
    await medir('Revocar permiso', async () => relayer.revoke(await a.permits.signRevoke(permitId)));
    await refrescar();
    avisar('ok', 'Permiso revocado. El agente ya no puede gastar.');
  }), [actuar, avisar, medir, refrescar, relayer]);

  const pedirSaldo = useCallback(() => actuar('faucet', async () => {
    await medir('Saldo de prueba (faucet)', () => relayer.faucet(sesion.current.address));
    await refrescar();
    avisar('ok', 'Recibiste saldo de prueba.');
  }), [actuar, avisar, medir, refrescar, relayer]);

  // Aprobar con la huella: aquí SÍ aparece la ventana de la passkey, a propósito.
  const aprobar = useCallback((requestId) => actuar(`approve-${requestId}`, async () => {
    const a = asegurar();
    const auth = await a.permits.signApproval(requestId, { credentialId: sesion.current.credentialId });
    await medir('Aprobar pago con la huella', () => relayer.approve(requestId, auth));
    await refrescar();
    avisar('ok', 'Pago aprobado con tu huella y ejecutado.');
  }), [actuar, avisar, medir, refrescar, relayer]);

  const valor = {
    fase, modo, pasos, direccion, datos, aviso, errorInicio, ocupado, bloqueaEn, necesitaPrueba, metricas, historial,
    permisoActual, pendientes, relayer,
    empezar, reintentar, entrar, bloquear, olvidar, crearPermiso, revocarPermiso, pedirSaldo, aprobar,
    refrescar: () => actuar('refresh', refrescar),
    refrescarAhora: refrescar, tocar, anotar, avisar,
    descartarAviso: () => setAviso(null),
    credentialId: sesion.current?.credentialId ?? null,
    usd,
  };
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}
