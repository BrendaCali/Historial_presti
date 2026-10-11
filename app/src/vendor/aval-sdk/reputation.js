import { reputationReaderAbi } from './abi.js';
import { read } from './context.js';
const ZERO = '0x0000000000000000000000000000000000000000';
export function createReputation(ctx) {
    const address = ctx.addresses.reputationReader;
    return {
        /**
         * Reputación del agente contando solo a quienes le pagaron a través de AgentPermit. Cualquiera puede escribir
         * una reseña en ERC-8004; las que no vienen de un cliente con recibo no entran en el resultado.
         */
        async summary(agentId, options = {}) {
            const result = await read(ctx, {
                address,
                abi: reputationReaderAbi,
                functionName: 'verifiedSummary',
                args: [agentId, options.tag1 ?? '', options.tag2 ?? '', options.minPaid ?? 0n, options.verifier ?? ZERO],
            });
            return {
                count: BigInt(result.count),
                value: BigInt(result.value),
                decimals: Number(result.decimals),
                verifiedClients: BigInt(result.verifiedClients),
            };
        },
        /** Cuentas que cuentan para la reputación del agente. */
        async clients(agentId, options = {}) {
            return read(ctx, {
                address,
                abi: reputationReaderAbi,
                functionName: 'verifiedClients',
                args: [agentId, options.minPaid ?? 0n, options.verifier ?? ZERO],
            });
        },
    };
}
//# sourceMappingURL=reputation.js.map