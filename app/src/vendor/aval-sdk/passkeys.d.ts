import type { Address, Hex } from 'viem';
import { type Ctx, type Sent } from './context.js';
import type { PasskeyPublicKey } from './webauthn.js';
export type SignedRegister = {
    owner: Address;
    key: PasskeyPublicKey;
    deadline: bigint;
    signature: Hex;
};
export declare function createPasskeys(ctx: Ctx): {
    /** Registra o rota la clave P256 de la cuenta que envía la transacción. */
    register(key: PasskeyPublicKey): Promise<Sent>;
    /** El usuario firma el registro de su clave sin gastar gas; un relayer lo envía con `relayRegister`. */
    signRegister(key: PasskeyPublicKey, options?: {
        deadline?: bigint;
    }): Promise<SignedRegister>;
    relayRegister(signed: SignedRegister): Promise<Sent>;
    /** Clave P256 registrada de `owner`, o `null` si no tiene. Sirve para reconstruir todo en un dispositivo nuevo. */
    keyOf: (owner: Address) => Promise<PasskeyPublicKey | null>;
    has(owner: Address): Promise<boolean>;
};
export type Passkeys = ReturnType<typeof createPasskeys>;
