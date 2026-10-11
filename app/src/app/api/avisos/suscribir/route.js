import { isAddress } from 'viem';

// Agrega la dirección de una cuenta nueva al webhook "Address Activity" de Alchemy,
// para que los movimientos de esa cuenta lleguen a /api/avisos.
// Necesita ALCHEMY_AUTH_TOKEN y ALCHEMY_WEBHOOK_ID (dashboard de Alchemy). Si faltan, no hace nada.
export async function POST(req) {
  const { direccion } = await req.json();
  if (!isAddress(direccion)) return Response.json({ error: 'direccion invalida' }, { status: 400 });

  const token = process.env.ALCHEMY_AUTH_TOKEN;
  const webhookId = process.env.ALCHEMY_WEBHOOK_ID;
  if (!token || !webhookId) return Response.json({ ok: false, motivo: 'webhook sin configurar' });

  const r = await fetch('https://dashboard.alchemy.com/api/update-webhook-addresses', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', 'X-Alchemy-Token': token },
    body: JSON.stringify({ webhook_id: webhookId, addresses_to_add: [direccion], addresses_to_remove: [] }),
  });
  return Response.json({ ok: r.ok, estado: r.status });
}
