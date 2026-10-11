# Preste

Historial de préstamos entre personas, con reputación verificable en Monad. Tu palabra ahora tiene historial.

App en Next.js (carpeta `app/`). Entras solo con tu huella: una passkey (Mera) crea o recupera tu cuenta, sin contraseña ni frase semilla.

## Qué tiene
- **Inicio con huella:** crear cuenta o entrar, y una pantalla "Cuenta lista" con saldo, firma sin aviso y transacción de prueba en Monad testnet.
- **Tablón** de préstamos ("Puedo prestar" / "Necesito"), interesados con comparativa, perfiles y publicar con formulario.
- **Mi código**, **Reputación** y **Mis Tratos**.
- Responsive: menú lateral en pantalla ancha, barra inferior en celular.
- **Alchemy:** RPC, historial con `alchemy_getAssetTransfers` y receptor de webhooks.

Los datos de personas, puntajes y préstamos son de **muestra**: todavía no se leen de la cadena.

## Correrla

```bash
cd app
npm install
cp .env.example .env.local   # y pon tu NEXT_PUBLIC_RPC_URL de Alchemy (Monad testnet)
npm run dev                  # http://localhost:3000
```

Necesitas Node 22+ y, para una passkey real, un dispositivo con soporte PRF (en Chrome de escritorio, passkeys guardadas en el gestor de contraseñas de Google; también sirven iCloud Keychain y 1Password). La passkey queda atada al dominio donde se creó.

## Documentos
En `docs/`: documento de la idea y cronograma (v3 y v4).
