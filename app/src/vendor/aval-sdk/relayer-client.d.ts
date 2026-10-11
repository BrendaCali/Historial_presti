import type { Address, Hash } from 'viem';
import type { SignedRegister } from './passkeys.js';
import type { SignedGrant, SignedRevoke } from './permits.js';
import type { SignedTokenPermit } from './tokens.js';
import type { WebAuthnAuth } from './webauthn.js';
export type RelayerFetch = (url: string, init: {
    method: string;
    headers: Record<string, string>;
    body?: string;
}) => Promise<{
    status: number;
    headers: {
        get(name: string): string | null;
    };
    text(): Promise<string>;
}>;
export type RelayerHealth = {
    ok: boolean;
    relayer: Address;
    chainId: number;
    balance: string;
    transactionsToday: number;
};
/** Datos del agente de demostración de un relayer. `ready` es falso si se quedó sin gas. */
export type DemoAgentInfo = {
    address: Address;
    /** Servicio al que el agente le paga: un agente de ERC-8004 cuya billetera recibe los pagos. */
    service: {
        address: Address;
        agentId: bigint;
    };
    token?: Address;
    balance: string;
    ready: boolean;
};
/**
 * Cliente de un relayer de Aval: le envías lo que el usuario firmó y él paga el gas, así el usuario no necesita MON.
 * El relayer nunca recibe claves privadas, solo firmas que no sirven para nada distinto a lo firmado.
 */
export declare function createRelayerClient(options: {
    url: string;
    fetch?: RelayerFetch;
}): {
    health: () => Promise<RelayerHealth>;
    /** Registra la clave P256 del usuario con su firma. */
    register: (signed: SignedRegister) => Promise<{
        hash: Hash;
    }>;
    /** Crea un permiso con la firma del usuario. */
    grant: (signed: SignedGrant) => Promise<{
        hash: Hash;
        permitId: bigint;
    }>;
    /** Revoca un permiso con la firma del usuario. */
    revoke: (signed: SignedRevoke) => Promise<{
        hash: Hash;
    }>;
    /** Autoriza a AgentPermit a mover un token con la firma ERC-2612 del usuario. */
    tokenPermit: (signed: SignedTokenPermit) => Promise<{
        hash: Hash;
    }>;
    /** Envía la aprobación con passkey de un gasto pendiente. */
    approve: (requestId: bigint, auth: WebAuthnAuth) => Promise<{
        hash: Hash;
    }>;
    /**
     * Agente de demostración del relayer: hace de agente de IA del usuario. El usuario le da un permiso (con su
     * dirección `info().address` como agente) y estas acciones muestran qué hace el contrato en cada caso.
     * Solo paga al servicio fijo que indica `info().service`.
     */
    agent: {
        info: () => Promise<DemoAgentInfo>;
        /** Paga dentro del permiso. Si el monto supera el umbral o los límites, el contrato lo rechaza y el error lo explica. */
        spend: (input: {
            permitId: bigint;
            amount: bigint;
            ref?: string;
        }) => Promise<{
            hash: Hash;
        }>;
        /** Pide un pago que supera el umbral: queda pendiente hasta que el usuario lo apruebe con su huella. */
        request: (input: {
            permitId: bigint;
            amount: bigint;
            ref?: string;
        }) => Promise<{
            hash: Hash;
            requestId: bigint;
        }>;
        /** Reseña al servicio (de 0 a 100). Solo cuenta en la reputación verificada si el agente ya le pagó. */
        review: (input: {
            value: number;
            tag?: string;
        }) => Promise<{
            hash: Hash;
        }>;
    };
    /** Pide dólares de prueba (tUSD) para una dirección. Tiene tiempo de espera por dirección. */
    faucet: (to: Address) => Promise<{
        hash: Hash;
        amount: bigint;
    }>;
};
export type RelayerClient = ReturnType<typeof createRelayerClient>;
