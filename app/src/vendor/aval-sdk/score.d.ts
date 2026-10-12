/**
 * Puntaje verificado de un agente, calculado con los mismos datos que usa el indexador (reseñas y pagos).
 * Es la misma función que corre en indexer/src/score.ts: los dos se prueban con los mismos casos
 * (indexer/test/vectors.json), así el SDK puede recalcular un puntaje y comprobar que el indexador no mintió.
 *
 * Reglas, de la más a la menos estricta con quien reseña:
 *  1. Solo cuenta quien le pagó al servicio a través de Aval, al menos `minPaid` en total.
 *  2. No cuenta quien está relacionado con el servicio: lo fondeó el propio servicio o es el servicio mismo.
 *  3. Cada persona cuenta una sola vez, con su reseña más reciente (el dueño del permiso y su agente son la misma persona).
 *  4. El puntaje es "Verified" solo con al menos `minHumans` personas distintas; antes es provisional.
 */
export type ScoreParams = {
    /** Pago acumulado mínimo, en unidades del token, para que un cliente cuente. */
    minPaid: bigint;
    /** Personas distintas necesarias para que el puntaje deje de ser provisional. */
    minHumans: number;
};
export type FeedbackInput = {
    client: string;
    feedbackIndex: bigint;
    value: bigint;
    decimals: number;
    createdAt: bigint;
};
/** Cuánto le pagó `client` al servicio. Viene de los eventos `Spent` de AgentPermit. */
export type RelationInput = {
    client: string;
    /** La persona detrás del pago: el dueño del permiso. */
    owner: string;
    totalPaid: bigint;
    relatedToPayee: boolean;
};
export type VerifiedScoreResult = {
    status: "Verified" | "Insufficient";
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
};
export declare function computeVerifiedScore(input: FeedbackInput[], relations: RelationInput[], params: ScoreParams): VerifiedScoreResult;
