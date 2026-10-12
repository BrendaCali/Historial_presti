import { monadTestnet } from './addresses.js';
import { createAgents } from './erc8004.js';
import { createPasskeys } from './passkeys.js';
import { createPermits } from './permits.js';
import { createReputation } from './reputation.js';
import { createTokens } from './tokens.js';
import { browserAssertion } from './webauthn.js';
/**
 * Punto de entrada del SDK.
 *
 * ```ts
 * const aval = createAval({ publicClient, walletClient });
 * const { permitId } = await aval.permits.grant({
 *   agent, maxPerSpend: 50_000000n, maxTotal: 300_000000n,
 *   approvalThreshold: 20_000000n, expiresIn: 86400,
 * });
 * ```
 */
export function createAval(options) {
    const addresses = options.addresses ?? monadTestnet;
    const ctx = {
        publicClient: options.publicClient,
        walletClient: options.walletClient,
        addresses,
        assertionProvider: options.assertionProvider ?? browserAssertion,
    };
    return {
        addresses,
        agents: createAgents(ctx),
        passkeys: createPasskeys(ctx),
        permits: createPermits(ctx),
        reputation: createReputation(ctx),
        tokens: createTokens(ctx),
    };
}
export { monadTestnet, erc8004MonadTestnet, P256_PRECOMPILE } from './addresses.js';
export { AvalError, explainError } from './errors.js';
export { recipientsHash, toRef } from './permits.js';
export { browserAssertion, buildAuth, derToRS, fromBase64Url, publicKeyFromSpki, toBase64Url, P256_N, } from './webauthn.js';
export { agentCardUri } from './erc8004.js';
export { createRelayerClient } from './relayer-client.js';
export { deserialize, serialize } from './wire.js';
export { createIndexerClient } from './indexer.js';
export { computeVerifiedScore } from './score.js';
//# sourceMappingURL=index.js.map