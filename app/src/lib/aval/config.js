import { createPublicClient, defineChain, fallback, http } from 'viem';
import { monadTestnet } from '../../vendor/aval-sdk/index.js';

// En el navegador el relayer se llama por un puente de nuestro servidor (/api/relayer): el relayer solo acepta
// los orígenes de su lista (CORS) y el nuestro no está en ella. En el servidor se llama directo.
export const RELAYER_URL = 'https://aval-relayer.vercel.app';
export const RELAYER_BASE = typeof window === 'undefined' ? RELAYER_URL : '/api/relayer';

// RPC de Monad testnet en orden de preferencia: primero el de Alchemy (si está configurado), luego los públicos.
// Si uno no responde, viem pasa al siguiente.
export const RPC_URLS = [
  process.env.NEXT_PUBLIC_RPC_URL,
  'https://testnet-rpc.monad.xyz',
  'https://rpc-testnet.monadinfra.com',
].filter(Boolean);

export const EXPLORER_URL = 'https://testnet.monadvision.com';
export const SESSION_MINUTES = 10; // minutos sin actividad antes de bloquear la sesión
export const USD = 1_000_000n; // unidad del dólar de prueba (6 decimales)

export const monad = defineChain({
  id: monadTestnet.chainId,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: RPC_URLS } },
  blockExplorers: { default: { name: 'MonVision', url: EXPLORER_URL } },
});

export const transport = fallback(RPC_URLS.map((url) => http(url, { timeout: 8_000, retryCount: 1 })));
export const publicClient = createPublicClient({ chain: monad, transport });

export const txUrl = (hash) => `${EXPLORER_URL}/tx/${hash}`;
export const addressUrl = (address) => `${EXPLORER_URL}/address/${address}`;

// Formato de montos en tUSD (6 decimales): 1_500000n -> "1.5"
export function usd(valor) {
  const entero = valor / USD;
  const resto = (valor % USD).toString().padStart(6, '0').replace(/0+$/, '');
  return resto ? `${entero}.${resto}` : `${entero}`;
}
export const aUnidades = (texto) => {
  const n = Number(texto);
  return Number.isFinite(n) && n > 0 ? BigInt(Math.round(n * 1_000_000)) : null;
};
