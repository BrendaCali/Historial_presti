// Indexador GraphQL de MENTIRA, solo para probar la integración sin la URL real de Envio Cloud:
//   node scripts/indexador-falso.mjs        (escucha en http://localhost:4000)  y  INDEXER_URL=http://localhost:4000 npm run dev
// Los datos son inventados; el puntaje guardado se calcula con la misma función del SDK, así que el recálculo coincide.
// Con  MENTIR=1  el puntaje guardado se altera a propósito, para ver que la comprobación lo detecta.
import http from 'node:http';
import { computeVerifiedScore } from '../src/vendor/aval-sdk/score.js';

const WALLET = '0xdf7868e29d39addad5b6e1162738657432f53a19';
const AGENT = '2090';
const U = (n) => BigInt(n) * 1_000_000n;
const cliente = (i) => `0x${String(i).repeat(40)}`;

const feedbacks = [
  { client: cliente(1), feedbackIndex: 1n, value: 90n, decimals: 0, createdAt: 100n },
  { client: cliente(2), feedbackIndex: 1n, value: 80n, decimals: 0, createdAt: 110n },
  { client: cliente(3), feedbackIndex: 1n, value: 100n, decimals: 0, createdAt: 120n },
  { client: cliente(4), feedbackIndex: 1n, value: 10n, decimals: 0, createdAt: 130n }, // nunca le pagó: no cuenta
  { client: cliente(5), feedbackIndex: 1n, value: 100n, decimals: 0, createdAt: 140n }, // autopago: no cuenta
];
const relaciones = [
  { client: cliente(1), owner: cliente(1), totalPaid: U(10), relatedToPayee: false },
  { client: cliente(2), owner: cliente(2), totalPaid: U(5), relatedToPayee: false },
  { client: cliente(3), owner: cliente(3), totalPaid: U(20), relatedToPayee: false },
  { client: cliente(5), owner: cliente(5), totalPaid: U(50), relatedToPayee: true },
];
const params = { minPaid: U(1), minHumans: 3 };
const r = computeVerifiedScore(feedbacks, relaciones, params);
const guardado = {
  agentId: AGENT, wallet: WALLET, status: r.status,
  verifiedAverage: process.env.MENTIR ? 100 : r.verifiedAverage, verifiedHumans: r.verifiedHumans, totalFeedbackCount: r.totalFeedbackCount,
  rawAverage: r.rawAverage, excludedNotPaid: r.excludedNotPaid, excludedBelowMinPaid: r.excludedBelowMinPaid, excludedRelated: r.excludedRelated,
  topClientShare: r.topClientShare, payingHumans: r.payingHumans, totalPaid: r.totalPaid.toString(), minPaid: params.minPaid.toString(), minHumans: params.minHumans, updatedAt: '200',
};
const pagos = [{ id: '1234_0', permit_id: '11', payee: WALLET, amount: '10000000', approvedByUser: false, timestamp: String(Math.floor(Date.now() / 1000) - 3600) }];

http.createServer((req, res) => {
  let cuerpo = '';
  req.on('data', (c) => (cuerpo += c));
  req.on('end', () => {
    const q = JSON.parse(cuerpo || '{}').query ?? '';
    let data = {};
    if (q.includes('AgentScore_by_pk')) data = { AgentScore_by_pk: q.includes(`"${AGENT}"`) ? guardado : null };
    else if (q.includes('Feedback(')) data = { Feedback: feedbacks.map((f) => ({ client: f.client, feedbackIndex: f.feedbackIndex.toString(), value: f.value.toString(), decimals: f.decimals, createdAt: f.createdAt.toString() })) };
    else if (q.includes('PaidRelation(')) data = { PaidRelation: relaciones.map((x) => ({ client: x.client, owner: x.owner, totalPaid: x.totalPaid.toString(), relatedToPayee: x.relatedToPayee })) };
    else if (q.includes('Payment(')) data = { Payment: pagos };
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ data }));
  });
}).listen(4000, () => console.log('Indexador falso en http://localhost:4000', process.env.MENTIR ? '(MIENTE a propósito)' : ''));
