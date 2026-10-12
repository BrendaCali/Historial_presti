import type { PublicClient, WalletClient } from 'viem';
import { type AvalAddresses } from './addresses.js';
import { type AssertionProvider } from './webauthn.js';
export type CreateAvalOptions = {
    /** Cliente de lectura de viem conectado a la red de Aval. */
    publicClient: PublicClient;
    /** Cliente con la cuenta que firma y envía. Hace falta para escribir. */
    walletClient?: WalletClient;
    /** Direcciones de los contratos. Por defecto, el despliegue en Monad testnet. */
    addresses?: AvalAddresses;
    /** Cómo se pide la huella al usuario. Por defecto, WebAuthn del navegador. */
    assertionProvider?: AssertionProvider;
};
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
export declare function createAval(options: CreateAvalOptions): {
    addresses: AvalAddresses;
    agents: {
        register(options?: {
            uri?: string;
        }): Promise<{
            agentId: bigint;
        } & import("./context.js").Sent>;
        walletOf(agentId: bigint): Promise<import("abitype").Address>;
        review(agentId: bigint, input: {
            value: number | bigint;
            tag1?: string;
            tag2?: string;
            uri?: string;
        }): Promise<import("./context.js").Sent>;
    };
    passkeys: {
        register(key: import("./webauthn.js").PasskeyPublicKey): Promise<import("./context.js").Sent>;
        signRegister(key: import("./webauthn.js").PasskeyPublicKey, options?: {
            deadline?: bigint;
        }): Promise<import("./passkeys.js").SignedRegister>;
        relayRegister(signed: import("./passkeys.js").SignedRegister): Promise<import("./context.js").Sent>;
        keyOf: (owner: import("abitype").Address) => Promise<import("./webauthn.js").PasskeyPublicKey | null>;
        has(owner: import("abitype").Address): Promise<boolean>;
    };
    permits: {
        grant(input: import("./permits.js").GrantInput): Promise<{
            permitId: bigint;
        } & import("./context.js").Sent>;
        signGrant(input: import("./permits.js").GrantInput, options?: {
            deadline?: bigint;
        }): Promise<import("./permits.js").SignedGrant>;
        relayGrant(signed: import("./permits.js").SignedGrant): Promise<{
            permitId: bigint;
        } & import("./context.js").Sent>;
        revoke(permitId: bigint): Promise<import("./context.js").Sent>;
        signRevoke(permitId: bigint, options?: {
            deadline?: bigint;
        }): Promise<import("./permits.js").SignedRevoke>;
        relayRevoke(signed: import("./permits.js").SignedRevoke): Promise<import("./context.js").Sent>;
        spend(input: {
            permitId: bigint;
            to: import("abitype").Address;
            amount: bigint;
            ref?: string | import("viem").Hex;
        }): Promise<import("./context.js").Sent>;
        requestSpend(input: {
            permitId: bigint;
            to: import("abitype").Address;
            amount: bigint;
            ref?: string | import("viem").Hex;
        }): Promise<{
            requestId: bigint;
        } & import("./context.js").Sent>;
        challenge: (requestId: bigint) => Promise<`0x${string}`>;
        signApproval: (requestId: bigint, options?: {
            credentialId?: string;
            rpId?: string;
        }) => Promise<import("./webauthn.js").WebAuthnAuth>;
        submitApproval: (requestId: bigint, auth: import("./webauthn.js").WebAuthnAuth) => Promise<import("./context.js").Sent>;
        approve(requestId: bigint, options?: {
            credentialId?: string;
            rpId?: string;
        }): Promise<import("./context.js").Sent>;
        listByOwner(owner: import("abitype").Address, options?: {
            limit?: number;
        }): Promise<{
            permitId: bigint;
            permit: import("./permits.js").Permit;
        }[]>;
        listByAgent(agent: import("abitype").Address, options?: {
            limit?: number;
        }): Promise<{
            permitId: bigint;
            permit: import("./permits.js").Permit;
        }[]>;
        requestsOf(owner: import("abitype").Address, options?: {
            limit?: number;
        }): Promise<{
            requestId: bigint;
            request: import("./permits.js").SpendRequest;
        }[]>;
        receiptsOf(owner: import("abitype").Address, options?: {
            limit?: number;
        }): Promise<import("./permits.js").Receipt[]>;
        get(permitId: bigint): Promise<import("./permits.js").Permit>;
        getRequest(requestId: bigint): Promise<import("./permits.js").SpendRequest>;
        remaining(permitId: bigint): Promise<bigint>;
        isAllowedRecipient(permitId: bigint, to: import("abitype").Address): Promise<boolean>;
        paidAmount(payee: import("abitype").Address, client: import("abitype").Address): Promise<bigint>;
    };
    reputation: {
        summary(agentId: bigint, options?: import("./reputation.js").SummaryOptions): Promise<import("./reputation.js").VerifiedSummary>;
        clients(agentId: bigint, options?: Pick<import("./reputation.js").SummaryOptions, 'minPaid' | 'verifier'>): Promise<import("abitype").Address[]>;
    };
    tokens: {
        signPermit(input: {
            value: bigint;
            token?: import("abitype").Address;
        }, options?: {
            deadline?: bigint;
        }): Promise<import("./tokens.js").SignedTokenPermit>;
        relayPermit(signed: import("./tokens.js").SignedTokenPermit): Promise<import("./context.js").Sent>;
        approve(input: {
            value: bigint;
            token?: import("abitype").Address;
        }): Promise<import("./context.js").Sent>;
        balanceOf(owner: import("abitype").Address, token?: import("abitype").Address): Promise<bigint>;
        faucet(input: {
            to: import("abitype").Address;
            amount: bigint;
        }): Promise<import("./context.js").Sent>;
    };
};
export type Aval = ReturnType<typeof createAval>;
export { monadTestnet, erc8004MonadTestnet, P256_PRECOMPILE } from './addresses.js';
export type { AvalAddresses } from './addresses.js';
export { AvalError, explainError } from './errors.js';
export type { GrantInput, Permit, Receipt, SpendRequest, SignedGrant, SignedRevoke } from './permits.js';
export { recipientsHash, toRef } from './permits.js';
export type { SignedRegister } from './passkeys.js';
export type { SignedTokenPermit } from './tokens.js';
export type { SummaryOptions, VerifiedSummary } from './reputation.js';
export { browserAssertion, buildAuth, derToRS, fromBase64Url, publicKeyFromSpki, toBase64Url, P256_N, } from './webauthn.js';
export type { AssertionProvider, PasskeyPublicKey, RawAssertion, WebAuthnAuth } from './webauthn.js';
export { agentCardUri } from './erc8004.js';
export type { AgentCard } from './erc8004.js';
export { createRelayerClient } from './relayer-client.js';
export type { DemoAgentInfo, RelayerClient, RelayerFetch, RelayerHealth } from './relayer-client.js';
export { deserialize, serialize } from './wire.js';
export { createIndexerClient } from './indexer.js';
export type { AgentScoreRecord, IndexerClient, IndexerFetch, PaymentRecord, ScoreCheck } from './indexer.js';
export { computeVerifiedScore } from './score.js';
export type { FeedbackInput as ScoreFeedback, RelationInput as ScoreRelation, ScoreParams, VerifiedScoreResult } from './score.js';
