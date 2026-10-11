import { type Address, type Hex } from 'viem';
import { type Ctx, type Sent } from './context.js';
export type SignedTokenPermit = {
    token: Address;
    owner: Address;
    value: bigint;
    deadline: bigint;
    signature: Hex;
};
/**
 * Autorizar a AgentPermit a mover un token sin gas: el usuario firma (ERC-2612) y un relayer envía.
 * Sin esto, el usuario necesitaría MON para hacer `approve`.
 */
export declare function createTokens(ctx: Ctx): {
    /** El usuario firma la autorización de gasto para AgentPermit. */
    signPermit(input: {
        value: bigint;
        token?: Address;
    }, options?: {
        deadline?: bigint;
    }): Promise<SignedTokenPermit>;
    /** Un relayer envía la autorización firmada y paga el gas. */
    relayPermit(signed: SignedTokenPermit): Promise<Sent>;
    /** Autoriza a AgentPermit enviando la transacción desde la cuenta del usuario (necesita MON). */
    approve(input: {
        value: bigint;
        token?: Address;
    }): Promise<Sent>;
    balanceOf(owner: Address, token?: Address): Promise<bigint>;
    /** Pide dólares de prueba (solo testnet, hasta 1.000 por llamada). */
    faucet(input: {
        to: Address;
        amount: bigint;
    }): Promise<Sent>;
};
export type Tokens = ReturnType<typeof createTokens>;
