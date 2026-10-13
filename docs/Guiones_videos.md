# Guiones de video (Preste)

Antes de grabar: pantalla completa del navegador, zoom 100 %, sin otras pestañas. Si tu voz sale mejor en español, graba en español y activa subtítulos en inglés. Los jueces leen inglés.
App: https://app-wheat-eta-38.vercel.app

Orden recomendado: 1 Mera UX, 2 Mera llave maestra, 3 Alchemy, 4 Demo (3 min), 5 Pitch.

---

## 1. Mera UX (máx. 2 min)
Lo que piden: Mera como toda la capa de cuentas, UX, prueba sin estado.

| Tiempo | Pantalla | Decir |
|---|---|---|
| 0:00 | Inicio | "Preste se usa solo con la huella. Sin contraseña, sin frase semilla, sin MON." |
| 0:10 | Pulsar **Crear cuenta con mi huella** | "Una sola ceremonia de passkey crea la cuenta, la registra en la cadena y el relayer paga el gas." |
| 0:35 | Panel "Cuenta lista" | "Tiempo, toques y primera transacción real en Monad testnet." Abre el enlace de la tx. |
| 0:55 | Chip de sesión con cuenta regresiva | "La sesión vive solo en memoria y se bloquea sola por inactividad. Avisa antes y se puede extender." |
| 1:15 | Dejar que se bloquee, volver a entrar con huella | "Misma dirección: la cuenta sale de la huella, no de algo guardado." |
| 1:30 | Actividad → **Probar como dispositivo nuevo** (o perfil nuevo de Chrome) | "Prueba sin estado: borro el almacenamiento local y entro de nuevo. Cuenta, permisos y memoria reaparecen." |
| 1:55 | Cierre | "Mera es toda la capa de cuentas." |

## 2. Mera: una llave maestra, muchas llaves (máx. 2 min)
Lo que piden: un espacio de nombres PRF que NO firme transacciones, en vivo.

| Tiempo | Pantalla | Decir |
|---|---|---|
| 0:00 | Asistente | "Misma huella, otra llave. De la salida PRF derivo con HKDF dos valores independientes, con etiquetas distintas." |
| 0:15 | Escribir un mensaje al asistente | "Una clave AES-GCM para cifrar y un id anónimo para guardar. Ninguna firma transacciones." |
| 0:35 | Abrir Blob / Network en DevTools (pestaña Network, petición a /api/memoria) | "El servidor solo recibe iv y texto cifrado. No puede leer la conversación." |
| 1:00 | Perfil nuevo de Chrome, misma huella, entrar | "Otro dispositivo, misma huella." |
| 1:20 | Asistente: aparece la conversación anterior | "La misma clave se reconstruye y la memoria se descifra. Nada sensible se guardó." |
| 1:45 | Cierre | "Una huella, muchas llaves independientes." |

Límite honesto a decir: mientras responde, el texto pasa por el servidor para llegar al modelo; no se guarda en claro.

## 3. Alchemy (máx. 2 min)
| Tiempo | Pantalla | Decir |
|---|---|---|
| 0:00 | Código: `NEXT_PUBLIC_RPC_URL` o la tarjeta de Actividad | "Todo el RPC de la app va por Alchemy en Monad testnet." |
| 0:20 | Actividad: historial de tUSD | "Leo los movimientos con `alchemy_getAssetTransfers`." |
| 0:50 | Dashboard de Alchemy → Webhooks | "Un webhook Address Activity apunta a /api/avisos." |
| 1:10 | Mover tUSD (pago del asistente) y mirar Avisos en vivo | "Alchemy avisa, la app verifica la firma HMAC-SHA256 y lo muestra sin recargar." |
| 1:40 | Cierre | "RPC, histórico y webhook firmado." |

## 4. Demo (máx. 3 min)
Dos pestañas: `/?u=ana` y `/?u=beto` (modo de prueba) o dos dispositivos.

| Tiempo | Qué pasa |
|---|---|
| 0:00 | Ana crea cuenta con la huella y deposita en Billetera. |
| 0:25 | Ana publica una oferta en el Tablón. |
| 0:45 | Beto ve la oferta, pulsa **Me interesa**. |
| 1:05 | Ana ve a los interesados con su reputación y elige a Beto. |
| 1:20 | Beto acepta, Ana desembolsa. |
| 1:40 | Beto abona una cuota. |
| 1:55 | Asistente: "ofertas con un presupuesto de 30 dólares" (muestra pasos y tarjetas). |
| 2:20 | **Mi código**: el QR cambia cada 30 s; el otro lo escanea y califica. |
| 2:45 | Perfil de Beto: reputación e historial. Cierre. |

## 5. Pitch (máx. 2 min)
Puede ser tú hablando a cámara sobre diapositivas o la app.
1. Problema (20 s): en Bolivia muchos préstamos son de confianza y no dejan rastro.
2. Solución (30 s): Preste convierte cada préstamo en historial verificable; entras con la huella.
3. Cómo (40 s): Aval pone permisos y reputación en Monad; Mera da la cuenta; el asistente con Qwen busca ofertas.
4. Por qué importa (20 s): reputación que viaja contigo; el dinero hoy es de prueba.
5. Cierre (10 s): enlace de la app y del repo.

## Antes de grabar el video 4
Dime y vacío los datos de producción (`node app/scripts/vaciar-produccion.mjs --borrar`), para empezar con el tablón limpio.
