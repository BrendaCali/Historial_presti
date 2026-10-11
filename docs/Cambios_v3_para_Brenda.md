# Garante · Cambios de la v3 para la app (Brenda)

Fecha: 4 oct 2026 · Base: *Documento de la idea v3* y *Cronograma v3* · Código: `app/` de este repo.

Este documento baja los cambios marcados **NUEVO** en la v3 a tareas concretas: **qué cambia, cómo se implementa y en qué archivo**. Es solo la parte de la app; los contratos, el indexer y el agente son de Alan.

## 1. Dónde estamos

| Pieza | Estado | Archivo |
|---|---|---|
| Registro: carnet (número + foto) | Hecho. La foto queda solo en memoria, la verificación es simulada | `src/app/Registro.jsx` |
| Registro: selfie con cámara | Hecho | `src/app/Registro.jsx` |
| Cuenta con huella (Mera: passkey, PRF, cuenta EVM) | Hecho | `src/lib/mera.js`, `src/app/CuentaProvider.jsx` |
| Volver a entrar con huella (sin guardar nada) | Hecho | `entrarConHuella()` en `src/lib/mera.js` |
| Firma sin pedir huella (sesión de Mera) | Hecho, como prueba de firma | `CuentaProvider.firmar` |
| Primera transacción en Monad testnet | Hecho como prueba (0 MON a sí misma); falta el gas | `enviarPrueba()` en `src/lib/mera.js` |
| Tablón, interesados, mi código, reputación | Pantallas de Stitch con datos fijos, sin conectar | `src/app/(prestis)/` |
| Mis Tratos | Sin diseño | — |

Lo que **no** se ha probado: la ceremonia real de passkey en celular y la transacción confirmada. En Chrome de escritorio la passkey debe estar en el Gestor de contraseñas de Google (pide un PIN de recuperación la primera vez).

## 1.1 Ejemplo: las dos bounties de Mera ya agregadas

Según la captura del panel (4 oct), las dos están en **Agregado** ($2,500 cada una, todas las pistas): *Best Mera-Powered UX on Monad* y *Mera: One Passkey, Many Keys*. Así queda lo que ya hicimos y lo que falta para cada criterio de los jueces.

| Criterio de los jueces | Ya hecho | Falta | Sección |
|---|---|---|---|
| Tiempo hasta la primera transacción | Cuenta con una sola huella y transacción de prueba, con el tiempo medido | Fondos de arranque, medir desde el inicio del registro, RPC de Alchemy | 2.4 |
| Sesiones con alcance | Sesión de firma en memoria que firma sin pedir huella | Expiración por inactividad y huella fresca para abrir, confirmar o calificar | 2.1 |
| Prueba stateless | Nada se guarda en el navegador; "Ya tengo cuenta" reconstruye la misma dirección | Repetirla en celular, en Chrome y en el despliegue final | 2.1 |
| Una sola ceremonia de passkey | `createPasskeyWithPrfOutput` | Comprobar que el autenticador de la demo no pide un segundo aviso | 2.2 |
| *One Passkey, Many Keys*: varias llaves de la misma huella | Solo la cuenta EVM | Llave de cifrado, sal del commit y clave del código con HKDF | 2.1 y 2.7 |
| Despliegue y demo en vivo | Corre en local | Dominio fijo en Vercel y modo juez | 2.3 y 2.5 |
| Entregables | — | Texto de integración y video de hasta 2 min | 2.10 |

## 2. Cambios, uno por uno

### 2.1 Mera como capa de cuenta completa

**Sesiones por alcance** (v3, sección "Mera como capa de cuenta")

| Acción | ¿Huella? | Cómo |
|---|---|---|
| Crear cuenta | Sí, 1 vez | Ya está en `crear()`. Sumar la primera tx en el mismo paso (ver 2.4) |
| Volver a entrar | Sí, 1 vez | Ya está en `entrar()` |
| Ver tablón, perfiles, "Me interesa" | No | Usar la sesión en memoria |
| Abrir/confirmar préstamo, calificar, revelar | Sí, cada vez | Cerrar sesión, pedir huella nueva, firmar el EIP-712 |
| Inactividad | — | Cerrar la sesión a los pocos minutos y mostrar "Continuar con huella" |

Cómo implementarlo, en `src/app/CuentaProvider.jsx`:
- Agregar un temporizador de inactividad que llame a `salir()` (zeroa la clave con `session.end()`) y deje un estado `sesionExpirada`.
- Agregar `firmarAccion(typedData)`: llama a `entrar()` para una huella fresca, firma con `cuenta.signTypedData(...)` y cierra la sesión.
- Mostrar un banner global "Continuar con huella" cuando `sesionExpirada` sea verdadero. Va en el layout de `(prestis)`.
- Proteger las rutas de `(prestis)`: si no hay `direccion`, mostrar el botón "Continuar con huella" en vez de la pantalla vacía. Hoy `/tablon` se abre sin sesión.

**Prueba stateless** (regla del equipo: ninguna clave, PRF ni sesión en el navegador)
- Hoy no se usa `localStorage`, `sessionStorage` ni IndexedDB. Mantenerlo así. Revisar con `grep -rn "localStorage\|sessionStorage\|indexedDB" src` antes de cada despliegue.
- Prueba: borrar el almacenamiento del sitio, entrar con la huella y comprobar que sale la misma dirección y el mismo perfil.
- Al recargar la página la sesión se pierde: es lo esperado, hay que dejar claro el botón "Continuar con huella".

**Una passkey, muchas llaves** (v3, tabla "Una passkey, muchas llaves"). En `src/lib/mera.js`, hoy `abrirSesion()` solo deriva la cuenta EVM. Agregar:

| Llave | Para qué | Derivación |
|---|---|---|
| Cuenta EVM | Transacciones y EIP-712 | Ya está (`m/44'/60'/0'/0/0`) |
| Llave de cifrado | Cifrar el monto exacto y datos privados | HKDF-SHA256 del `prfOutput`, etiqueta `garante/cifrado/v1` |
| Sal del commit | Calificación a ciegas | HKDF, etiqueta `garante/commit/v1` |
| Clave del código | Firmar el QR y el código de 6 dígitos | HKDF, etiqueta `garante/codigo/v1` |

Las etiquetas distintas son lo que hace que las llaves no se puedan mezclar. Se usa `crypto.subtle.deriveBits` (nativo, sin librería) y `abrirSesion()` devuelve las cuatro. `prfOutput` debe vivir solo dentro de esa función y no salir de ella.

### 2.2 Registro con verificación simulada

- El registro ya sigue el orden carnet, selfie, huella. Falta que la verificación de carnet+selfie llame a una función con la **interfaz tipo CVI** (`verificar({ci, fotoCarnet, selfie}) → {ok, hashCarnet}`). Crear `src/lib/verificador.js` con una versión simulada que siempre dice sí. Así luego se conecta el verificador real sin tocar la pantalla.
- El carnet nunca va a la cadena. Solo se manda el hash con sal a `GaranteIdentity` (lo recibe Alan).
- Pendiente: el segundo aviso de huella. En algunos autenticadores aparece una segunda aserción al crear la cuenta; probar con los dispositivos de la demo y elegir uno con un solo aviso.

### 2.3 Modo juez rediseñado

Hoy el botón "Soy juez: entrar con una cuenta de prueba" (en `Registro.jsx`) entra directo al Tablón y **debe reemplazarse**: las cuentas compartidas no pasan la prueba stateless.

Nuevo flujo:
1. El juez crea su propia cuenta con su huella (flujo normal, sin carnet boliviano: el botón salta carnet y selfie y llama al verificador simulado).
2. Pantalla "Cargar historial de ejemplo": simula la verificación y carga 2–3 historiales de muestra.
3. Los datos de muestra se marcan como tales en la interfaz.

Dónde: un modo `?juez=1` o un botón en `Registro.jsx`, y una pantalla nueva `src/app/juez/page.jsx`. Las instrucciones para jueces incluyen el aviso de Mera en Chrome de escritorio.

### 2.4 Fondos de arranque y primera transacción

Una cuenta nueva no tiene MON para el gas, así que la transacción de prueba falla hasta que se le envíe saldo.

- Crear la ruta `src/app/api/fondos/route.js`: recibe la dirección, envía una cantidad pequeña de MON de prueba y limita una vez por dirección.
- La clave del dispensador va solo en `.env.local` y en Vercel. Nunca en el repo ni en el navegador. Agregar la variable a `.env.example`.
- En `Registro.jsx`, al crear la cuenta: pedir fondos, esperar y mandar la primera transacción real (el registro en `GaranteIdentity`, que hará Alan; mientras tanto, la de prueba actual).
- Medir toques y segundos desde el inicio hasta la transacción confirmada; es el criterio de los jueces de Mera. Hoy `probarTx` ya mide los segundos de la transacción; falta contar desde el inicio del registro.

Nota: el RPC público de Monad es lento y limitado. Poner el RPC de Alchemy en `.env.local` (`NEXT_PUBLIC_RPC_URL`) y leerlo en `monadTestnet` de `src/lib/mera.js`.

### 2.5 Dominio fijo

La passkey queda atada al dominio (hoy se usa `window.location.hostname`). Una passkey creada en `localhost` **no sirve** en el dominio final. Decidir el dominio de Vercel ya y probar ahí en celular y en Chrome de escritorio. Mejor tomar el `rpId` de una variable de entorno (`NEXT_PUBLIC_RP_ID`) para no depender del host.

### 2.6 Doble firma: EIP-712 con la cuenta Mera (ruta A)

La v3 deja abierta la decisión entre EIP-712 (MVP) y P256 en `0x0100` (Alan pregunta en el Discord). Para el MVP vamos con la **ruta A**:
- Alan te pasa la estructura EIP-712 de `Loan` (prestamista, deudor, monto, monto a devolver, fecha límite, nonce, expiración de 60 s).
- En la app: `firmarAccion()` (ver 2.1) firma esa estructura con `signTypedData` tras una huella fresca.
- Dónde: nueva `src/lib/prestamo.js` con el tipo EIP-712 y las funciones que llaman al contrato con viem. Por ahora las direcciones de los contratos se leen de una variable de entorno.

### 2.7 Pantalla "Mostrar mi código"

Archivo: `src/app/(prestis)/mi-codigo/CodigoDobleFirma.jsx`. Hoy el código es **aleatorio y falso** (`Math.random`, cuenta regresiva de 42). Cambiar a:
- Un QR con `{direccion, nonce, expiracion}` **firmado con la clave del código** (2.1). Cada 60 s se genera un nonce nuevo; muere al usarse.
- Los 6 dígitos son un código corto que apunta a ese QR a través de un relay temporal (decisión de Alan: ver el cronograma). El prestamista **no** puede verificar un TOTP; la verificación real es la firma del QR, con nonce y expiración en el contrato.
- Botones del diseño: "Escanear QR de otra persona" (cámara, como la selfie) y "Regenerar código ahora".
- Falta una librería de QR (por ejemplo `qrcode`).

### 2.8 Tablón, interesados y reputación: pasar de datos fijos a datos reales

Hoy son pantallas con datos escritos a mano. Se conectan **después** de que Alan tenga el indexer y el SDK (fase 2, 6–7 oct). Mientras tanto, solo los ajustes de diseño que pide la v3:

| Ajuste | Archivo |
|---|---|
| Montos exactos ("Total Devuelto", "Montos devueltos acumulados") → **rangos** (ej. Bs 500–1,000) | `tablon/interesados/Interesados.jsx` (línea ~30), `reputacion/page.jsx` (línea ~16) |
| "Nivel AA+" → los 4 niveles 🌱 🤝 ⭐ 🏆 | `reputacion/page.jsx` (línea ~79) |
| "Riesgo Calculado" en % → quitarlo o definirlo (el puntaje 0–1000 ya cumple) | `reputacion/page.jsx` (línea ~82) |
| "Chat Privado (Offchain P256)" → solo "offchain"; P256 solo si se confirma esa ruta | `tablon/interesados/Interesados.jsx` (línea ~197) |
| Nombres y cifras de ejemplo → marcarlos como datos de muestra | todos los de `(prestis)/` |
| Nombre "Prestis" junto a "Garante Protocol" → confirmar el nombre final antes de grabar | `_componentes/Encabezado.jsx` (líneas 22 y 55) |

Para el MVP también faltan: "Me interesa" real, lista de interesados con orden, "Comparar top 2", "Elegir para trato" (lleva al flujo de préstamo), y las pantallas de registrar préstamo, confirmar con código y huella, cerrar, y calificación a ciegas (commit y revelado).

### 2.9 Pantalla "Mis Tratos"

Sin diseño todavía. Está en la barra inferior (`_componentes/NavInferior.jsx`) deshabilitada. Pasos: diseñarla en Stitch (activos, vencidos, cerrados), crear `src/app/(prestis)/mis-tratos/page.jsx` y activar el enlace en `NavInferior`.

### 2.10 Entregables de las bounties de Mera

- Texto "Describe cómo tu proyecto integra Mera como toda la capa de cuenta" (12 oct).
- Video opcional de máx. 2 min: tiempo hasta la primera transacción, sesiones y prueba stateless. Por eso conviene medir la transacción desde ya (2.4).

## 3. Orden sugerido

1. **Hoy–5 oct:** probar la passkey en celular y Chrome; fondos de arranque (2.4); sesión por alcance y rutas protegidas (2.1); llaves HKDF (2.1); modo juez (2.3). Control del 5 oct: abrir, confirmar, cerrar y calificar con login real y prueba stateless.
2. **5–7 oct:** código dinámico real (2.7); `firmarAccion` con EIP-712 (2.6) cuando Alan pase la estructura; ajustes de privacidad (2.8); conectar tablón y perfil al SDK.
3. **8–11 oct:** Mis Tratos, pulido y celular, instrucciones para jueces, repetir la prueba stateless en el despliegue final.
4. **12–13 oct:** texto y video de Mera.

## 4. Decisiones que dependen de ustedes

- **Repo:** el cronograma habla del monorepo `garante-protocol` con `app/`. Este código vive en `HistorialDePrestamos/app`. Confirmar cuál es el repo final y moverlo si hace falta (los commits deben mostrar trabajo durante el hackathon).
- **JS o TS:** la v3 menciona `src/lib/mera.ts` y `src/lib/chain.ts`; hoy es JavaScript (`mera.js`). Cambiar a TypeScript o actualizar el cronograma.
- **Nombre:** "Prestis" o el que se decida, antes de grabar los videos.
- **Ruta de firma:** ruta A (EIP-712) para el MVP; el pitch dice "dos passkeys P256" y hay que ajustarlo a lo que quede implementado.
