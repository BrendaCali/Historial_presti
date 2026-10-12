# Bounty "Best Mera-Powered UX on Monad" · guía de entrega

Premio: $2,500 · Entrega: 13 de octubre, 23:59 GMT-4 · App desplegada: https://app-wheat-eta-38.vercel.app

## Texto para el formulario ("cómo integras Mera como toda la capa de cuenta")

Preste usa Mera como **toda** la capa de cuenta: no hay frase semilla, extensión de billetera, correo, OTP ni servidor de custodia.
Una sola ceremonia de passkey (`createPasskeyWithPrfOutput`) entrega la salida PRF, de la que se deriva la cuenta EVM
(BIP-39 → BIP-32) y se abre una sesión de firma (`createSecp256k1SigningSession` + `toViemAccount`). En esa misma ceremonia se captura la
clave pública P256 de la passkey y se registra en la cadena, de modo que las aprobaciones de pagos grandes se verifican onchain con el
precompile P256 de Monad. El usuario no necesita MON: un relayer patrocina el gas de cada operación firmada.
La sesión vive solo en memoria: firma sin pedir la huella lo cotidiano (crear permisos, revocar, pedir saldo, hablar con el asistente) y se
bloquea sola a los 10 minutos de inactividad, con un reloj visible, un aviso un minuto antes y una pantalla clara para continuar con la huella.
Aprobar un pago grande siempre exige la huella. Nada se guarda en el navegador: al borrar el almacenamiento o abrir un dispositivo nuevo,
la misma huella reconstruye la cuenta, los permisos, los recibos y la memoria cifrada del asistente desde la cadena.

## Criterios de los jueces → qué hay y dónde está

| Criterio | Qué hicimos | Dónde |
|---|---|---|
| **Tiempo hasta la primera transacción** (toques y segundos) | "Cuenta lista" muestra los segundos desde el primer toque, cuántos toques fueron, cuántas huellas se pidieron y la **primera transacción confirmada con enlace al explorador**. En la prueba: ~5 s, **1 toque**, 1 huella, primera tx a los ~3 s. | `app/Registro.jsx` (panel "Cuenta lista"), `app/AvalProvider.jsx` (`empezar`, `preparar`, `medir`, estados `metricas`, `primeraTx`, `toques`) |
| **Diseño de sesión** | Alcance explícito: sin huella vs. siempre huella. Reloj de la sesión en el encabezado (mantener / bloquear ahora), aviso a 1 minuto, bloqueo automático y pantalla "Continuar con huella". | `(prestis)/_componentes/ChipSesion.jsx`, `GuardiaSesion.jsx`; `AvalProvider.jsx` (`tocar`, `bloquear`, `actuar`); tarjeta "Alcance de la sesión" en `(prestis)/actividad/Actividad.jsx`; tiempo configurable con `NEXT_PUBLIC_SESSION_MINUTES` |
| **Prueba sin estado** | Ninguna clave, PRF ni sesión va a `localStorage`, `sessionStorage` ni IndexedDB (solo el modo "sin passkey", rotulado, usa `localStorage`). Botón "Probar como dispositivo nuevo" borra todo y, al entrar con la huella, todo reaparece. | `lib/aval/session.js` (`createAccount`, `signIn`), `AvalProvider.jsx` (`entrar`, `cargar`, `olvidar`) |
| **Componibilidad (bonus)** | Mera + gas patrocinado por relayer + registro P256 onchain + permisos con límites y aprobación con huella (Aval) + memoria cifrada con claves derivadas de la misma huella + Alchemy. | `lib/aval/*`, `vendor/aval-sdk/`, `lib/memoria.js`, `api/relayer`, `api/memoria` |

## Funciones de Mera que usamos

| Función | Para qué | Archivo |
|---|---|---|
| `createPasskeyWithPrfOutput` | Crear la passkey y obtener la salida PRF en **una** ceremonia | `lib/aval/session.js` → `createAccount` |
| `getPasskeyPrfOutput` | Volver a entrar (misma cuenta, sin guardar nada) | `lib/aval/session.js` → `signIn` |
| `createSecp256k1SigningSession` | Sesión de firma en memoria | `lib/aval/session.js` → `openSession` |
| `toViemAccount` (`@category-labs/mera/viem`) | Firmar con viem sin pedir huella | `lib/aval/session.js`, `AvalProvider.jsx` (`atar`) |
| `getEvmAddress` | Dirección de la cuenta | `lib/aval/session.js` |
| `webAuthnClient` propio | Capturar la clave P256 en la misma ceremonia | `lib/aval/passkey.js` (adaptado de la demo de Aval, con atribución) |

## Guion del video (máx. 2 minutos)

1. **0:00–0:20** Abrir el link en el celular. "Sin contraseña, sin frase semilla, sin extensión." Tocar **Crear cuenta con mi huella** (1 toque, 1 huella).
2. **0:20–0:40** Mostrar "Cuenta lista": segundos, 1 toque, saldo de prueba, huella registrada y la **primera transacción en el explorador**. "El usuario no necesitó MON."
3. **0:40–1:10** Crear un permiso y pedirle un pago al asistente: **sin ventanas**, sesión de Mera. Señalar el reloj de la sesión y la tarjeta "Alcance de la sesión".
4. **1:10–1:30** Pedir un pago grande y **aprobarlo con la huella**: aquí sí aparece la ventana. "Se verifica onchain con P256."
5. **1:30–1:50** Prueba sin estado: "Probar como dispositivo nuevo" (o abrir en otro dispositivo) → entrar con la huella → cuenta, permisos, recibos y memoria vuelven.
6. **1:50–2:00** Cierre: "Mera es toda la capa de cuenta."

Para mostrar la **expiración** en el video sin esperar 10 minutos, desplegar con `NEXT_PUBLIC_SESSION_MINUTES=2`.

## Lista de comprobación antes de entregar

- [ ] Probar el flujo completo **con huella real** en el celular y en Chrome de escritorio (passkey en el Gestor de contraseñas de Google).
- [ ] Prueba entre dispositivos: crear en el celular, entrar en la computadora con la misma passkey.
- [ ] Anotar los tiempos reales (toques y segundos) para el texto del formulario.
- [ ] Apagar `AGENTE_SIMULADO` en producción cuando Qwen esté conectado.
- [ ] Confirmar que el relayer tiene fondos (`https://aval-relayer.vercel.app/health` debe decir `"ok": true`).
