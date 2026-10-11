import type { Address } from 'viem';
import { type Ctx } from './context.js';
export type VerifiedSummary = {
    /** Reseñas que cuentan. */
    count: bigint;
    /** Promedio que calcula ERC-8004, con `decimals` decimales (truncado: conviene reseñar en escala 0-100). */
    value: bigint;
    decimals: number;
    /** Clientes que pasaron los filtros y entraron en la consulta. */
    verifiedClients: bigint;
};
export type SummaryOptions = {
    /** Filtros de etiqueta de ERC-8004. Vacío = todas. */
    tag1?: string;
    tag2?: string;
    /** Solo cuentan clientes que pagaron al menos esto al agente. */
    minPaid?: bigint;
    /** Contrato que decide quién es una persona verificada. Si se omite, no se exige verificación. */
    verifier?: Address;
};
export declare function createReputation(ctx: Ctx): {
    /**
     * Reputación del agente contando solo a quienes le pagaron a través de AgentPermit. Cualquiera puede escribir
     * una reseña en ERC-8004; las que no vienen de un cliente con recibo no entran en el resultado.
     */
    summary(agentId: bigint, options?: SummaryOptions): Promise<VerifiedSummary>;
    /** Cuentas que cuentan para la reputación del agente. */
    clients(agentId: bigint, options?: Pick<SummaryOptions, 'minPaid' | 'verifier'>): Promise<Address[]>;
};
export type Reputation = ReturnType<typeof createReputation>;
