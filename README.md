# Preste

Préstamos entre personas con reputación verificable, en Monad testnet. Tu palabra ahora tiene historial.

App en Next.js (carpeta `app/`). Se entra solo con la huella: una passkey (Mera) crea o recupera la cuenta, sin contraseña ni frase semilla ni necesitar MON.

## Cómo funciona

1. **Billetera:** cada persona tiene una billetera en **Bs de prueba**. Puede depositar y retirar (simula el paso con el banco, con topes y validaciones).
2. **Tablón:** se publica una **oferta** (alguien presta) o una **solicitud** (alguien necesita). Otras personas tocan **Me interesa**.
3. **Elegir:** quien publicó ve a los interesados con su reputación, los compara y **elige** con quién hacer el trato.
4. **Aceptación de ambas partes** → **desembolso** (el dinero pasa de la billetera de quien presta a la de quien recibe) → **abonos** por cuota, con validaciones (no se abona más de lo que se debe ni de lo que se tiene).
5. **Calificar:** al terminar, cada persona califica a la otra escaneando su **código QR, que cambia cada 30 segundos** y lo firma su cuenta. Así se prueba que están frente a frente. La reputación sale de los tratos pagados a tiempo y de las calificaciones.
6. **Asistente:** busca ofertas y solicitudes con un presupuesto y una moneda (Bs o USD) y resume qué te toca hacer. **No pide permisos** para consultar.
7. **Pagos autorizados (Aval), aparte y opcional:** permisos con límites para que el asistente pague en tUSD, con aprobación con huella verificada en la cadena (P256).

## Cómo está hecho

- **Cuenta:** `@category-labs/mera` (passkey + PRF). La sesión de firma vive solo en memoria y se bloquea sola; nada se guarda en el navegador.
- **Mercado:** `src/lib/mercado/` (lógica pura y probada) + `src/app/api/mercado`. El estado vive en Vercel Blob con control de concurrencia (ETag). **Cada petición va firmada con la cuenta del usuario**, sin ventanas de huella; el servidor recupera la dirección de la firma.
- **Memoria cifrada del asistente:** claves derivadas de la huella (HKDF), el servidor solo guarda texto cifrado (`src/lib/memoria.js`).
- **Aval** (protocolo de Alan, `github.com/Alan021011/Aval`): permisos, aprobaciones con passkey, relayer que paga el gas. SDK en `src/vendor/aval-sdk`.
- **Alchemy:** RPC y lectura de movimientos.

> El dinero es **de prueba**. Un préstamo con dinero real necesitaría un proveedor de pagos, cumplimiento legal y custodia; no está incluido.

## Correrla

```bash
cd app
npm install
cp .env.example .env.local   # NEXT_PUBLIC_RPC_URL (Alchemy) y, para guardar datos, BLOB_READ_WRITE_TOKEN (Vercel Blob)
npm run dev                  # http://localhost:3000
```

Sin `BLOB_READ_WRITE_TOKEN` el estado se guarda en memoria (se pierde al reiniciar). Para una passkey real hace falta un dispositivo con PRF (Chrome con el Gestor de contraseñas de Google, iCloud Keychain o 1Password); la passkey queda atada al dominio.

## Pruebas

```bash
node app/scripts/probar-mercado.mjs                 # lógica del mercado, sin red (58 comprobaciones)
node app/scripts/probar-api.mjs http://localhost:3000   # API real: firmas, replay, concurrencia, préstamo completo (30)
```

Para probar **dos personas a la vez** sin dos dispositivos, en modo "sin passkey" abre dos pestañas con `/?u=ana` y `/?u=beto`.

## Documentos
En `docs/`: documento de la idea y cronograma (v3 y v4, versiones anteriores), y la guía de Mera UX.
