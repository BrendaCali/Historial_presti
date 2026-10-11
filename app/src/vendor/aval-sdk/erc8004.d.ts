import { type Address } from 'viem';
import { type Ctx, type Sent } from './context.js';
/** Partes de ERC-8004 (agentes sin confianza previa) que usa Aval. Los registros oficiales ya están desplegados. */
export declare const identityRegistryAbi: readonly [{
    readonly name: "register";
    readonly type: 'function';
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "string";
        readonly name: "agentURI";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
        readonly name: "agentId";
    }];
}, {
    readonly name: "register";
    readonly type: 'function';
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
        readonly name: "agentId";
    }];
}, {
    readonly name: "getAgentWallet";
    readonly type: 'function';
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "agentId";
    }];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
}, {
    readonly name: "ownerOf";
    readonly type: 'function';
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "tokenId";
    }];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
}, {
    readonly name: "tokenURI";
    readonly type: 'function';
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "tokenId";
    }];
    readonly outputs: readonly [{
        readonly type: "string";
    }];
}, {
    readonly name: "Transfer";
    readonly type: 'event';
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "from";
        readonly indexed: true;
    }, {
        readonly type: "address";
        readonly name: "to";
        readonly indexed: true;
    }, {
        readonly type: "uint256";
        readonly name: "tokenId";
        readonly indexed: true;
    }];
}];
export declare const reputationRegistryAbi: readonly [{
    readonly name: "giveFeedback";
    readonly type: 'function';
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "agentId";
    }, {
        readonly type: "int128";
        readonly name: "value";
    }, {
        readonly type: "uint8";
        readonly name: "valueDecimals";
    }, {
        readonly type: "string";
        readonly name: "tag1";
    }, {
        readonly type: "string";
        readonly name: "tag2";
    }, {
        readonly type: "string";
        readonly name: "endpoint";
    }, {
        readonly type: "string";
        readonly name: "feedbackURI";
    }, {
        readonly type: "bytes32";
        readonly name: "feedbackHash";
    }];
    readonly outputs: readonly [];
}];
export type AgentCard = {
    name: string;
    description: string;
    [key: string]: unknown;
};
/** Convierte una "tarjeta de agente" (JSON) en un `data:` URI, para registrar un agente sin alojar ningún archivo. */
export declare function agentCardUri(card: AgentCard): string;
/** Registro de agentes y reseñas en ERC-8004. */
export declare function createAgents(ctx: Ctx): {
    /**
     * Registra un agente en ERC-8004: la cuenta que envía queda como su dueño y su billetera. Los pagos que reciba
     * esa billetera son los que cuentan para su reputación verificada. Devuelve el ID del agente.
     */
    register(options?: {
        uri?: string;
    }): Promise<{
        agentId: bigint;
    } & Sent>;
    /** Billetera registrada de un agente (a la que deben llegar los pagos). */
    walletOf(agentId: bigint): Promise<Address>;
    /**
     * Deja una reseña de un agente. Quien reseña es la cuenta que envía. Solo cuenta en la reputación verificada si
     * esa cuenta (o su dueño) le pagó al agente a través de AgentPermit. ERC-8004 no permite que el dueño del agente
     * se reseñe a sí mismo.
     * Conviene usar una escala de 0 a 100: el promedio que calcula ERC-8004 se trunca a enteros.
     */
    review(agentId: bigint, input: {
        value: number | bigint;
        tag1?: string;
        tag2?: string;
        uri?: string;
    }): Promise<Sent>;
};
export type Agents = ReturnType<typeof createAgents>;
