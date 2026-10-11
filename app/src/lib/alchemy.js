// Servicios propios de Alchemy (más allá del RPC genérico). Usan la misma URL de NEXT_PUBLIC_RPC_URL.
const URL_ALCHEMY = process.env.NEXT_PUBLIC_RPC_URL;

async function rpc(method, params) {
  const r = await fetch(URL_ALCHEMY, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j.result;
}

// Historial de transferencias de MON de una cuenta, con la API "Transfers" de Alchemy
// (alchemy_getAssetTransfers). Sin Alchemy habría que escanear bloque por bloque.
export async function actividad(direccion, max = 5) {
  if (!URL_ALCHEMY?.includes('alchemy.com')) return [];
  const base = { fromBlock: '0x0', toBlock: 'latest', category: ['external'], withMetadata: true, order: 'desc', maxCount: '0xa' };
  const [salidas, entradas] = await Promise.all([
    rpc('alchemy_getAssetTransfers', [{ ...base, fromAddress: direccion }]),
    rpc('alchemy_getAssetTransfers', [{ ...base, toAddress: direccion }]),
  ]);
  const unicos = new Map();
  for (const t of [...salidas.transfers, ...entradas.transfers]) unicos.set(t.uniqueId, t);
  return [...unicos.values()]
    .sort((a, b) => parseInt(b.blockNum, 16) - parseInt(a.blockNum, 16))
    .slice(0, max)
    .map((t) => ({
      hash: t.hash,
      tipo: t.to?.toLowerCase() === direccion.toLowerCase() ? 'recibido' : 'enviado',
      valor: t.value ?? 0,
      fecha: t.metadata?.blockTimestamp ?? null,
    }));
}

// Transferencias de un token ERC-20 (aquí tUSD) de una cuenta, con la misma API de Alchemy.
export async function actividadToken(direccion, token, max = 6) {
  if (!URL_ALCHEMY?.includes('alchemy.com')) return [];
  const base = { fromBlock: '0x0', toBlock: 'latest', category: ['erc20'], contractAddresses: [token], withMetadata: true, order: 'desc', maxCount: '0xa' };
  const [salidas, entradas] = await Promise.all([
    rpc('alchemy_getAssetTransfers', [{ ...base, fromAddress: direccion }]),
    rpc('alchemy_getAssetTransfers', [{ ...base, toAddress: direccion }]),
  ]);
  const unicos = new Map();
  for (const t of [...salidas.transfers, ...entradas.transfers]) unicos.set(t.uniqueId, t);
  return [...unicos.values()]
    .sort((a, b) => parseInt(b.blockNum, 16) - parseInt(a.blockNum, 16))
    .slice(0, max)
    .map((t) => ({
      hash: t.hash,
      tipo: t.to?.toLowerCase() === direccion.toLowerCase() ? 'recibido' : 'enviado',
      // Alchemy no siempre conoce los decimales de un token de prueba: se usa el valor crudo (6 decimales).
      valor: t.value || (t.rawContract?.value ? Number(BigInt(t.rawContract.value)) / 1e6 : 0),
      fecha: t.metadata?.blockTimestamp ?? null,
    }));
}
