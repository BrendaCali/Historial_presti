import { type VerifiedScoreResult } from './score.js';
/** Lo mínimo que se usa de `fetch`; así se puede probar sin red. */
export type IndexerFetch = (url: string, init: {
    method: 'POST';
    headers: Record<string, string>;
    body: string;
}) => Promise<{
    ok: boolean;
    status: number;
    json(): Promise<unknown>;
}>;
export type AgentScoreRecord = {
    agentId: bigint;
    wallet: string | null;
    status: 'Verified' | 'Insufficient';
    verifiedAverage: number | null;
    verifiedHumans: number;
    totalFeedbackCount: number;
    rawAverage: number | null;
    excludedNotPaid: number;
    excludedBelowMinPaid: number;
    excludedRelated: number;
    topClientShare: number | null;
    payingHumans: number;
    totalPaid: bigint;
    minPaid: bigint;
    minHumans: number;
    updatedAt: bigint;
};
export type PaymentRecord = {
    id: string;
    permitId: bigint;
    payee: string;
    amount: bigint;
    approvedByUser: boolean;
    timestamp: bigint;
};
export type ScoreCheck = {
    stored: AgentScoreRecord;
    recomputed: VerifiedScoreResult;
    /** Verdadero si el indexador y el recálculo con los mismos datos dan lo mismo. */
    matches: boolean;
    /** Campos en los que no coinciden (vacío si `matches`). */
    differences: string[];
};
type Row = Record<string, unknown>;
/**
 * Cliente del indexador de Aval (Envio HyperIndex, GraphQL). Lee el puntaje verificado de un agente, los pagos de un
 * usuario y, sobre todo, puede **comprobar** el puntaje: lo recalcula con las reseñas y los pagos en bruto, así no
 * hay que creerle al indexador.
 */
export declare function createIndexerClient(options: {
    url: string;
    fetch?: IndexerFetch;
}): {
    /** Consulta GraphQL libre. */
    query: <T = Row>(graphql: string) => Promise<T>;
    /** Puntaje verificado de un agente, o `null` si todavía no tiene reseñas. */
    agentScore: (agentId: bigint) => Promise<AgentScoreRecord | null>;
    /** Pagos hechos por (o a través de los permisos de) un usuario, del más reciente al más antiguo. */
    payments(owner: string, limit?: number): Promise<PaymentRecord[]>;
    /**
     * Recalcula el puntaje de un agente con las reseñas y los pagos en bruto del indexador, usando las mismas reglas
     * (`minPaid`, `minHumans`) con las que el indexador dice haberlo calculado, y lo compara con el guardado.
     * `null` si el agente no tiene puntaje.
     */
    verifyAgentScore(agentId: bigint): Promise<ScoreCheck | null>;
};
export type IndexerClient = ReturnType<typeof createIndexerClient>;
export {};
