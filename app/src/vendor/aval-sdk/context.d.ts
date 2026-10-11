import type { Abi, Address, Hash, PublicClient, TransactionReceipt, WalletClient } from 'viem';
import type { AvalAddresses } from './addresses.js';
import type { AssertionProvider } from './webauthn.js';
/** Contexto compartido por todos los módulos del SDK. */
export type Ctx = {
    publicClient: PublicClient;
    walletClient: WalletClient | undefined;
    addresses: AvalAddresses;
    assertionProvider: AssertionProvider;
};
export type Sent = {
    hash: Hash;
    receipt: TransactionReceipt;
};
type Call = {
    address: Address;
    abi: Abi;
    functionName: string;
    args?: readonly unknown[];
};
export declare function requireWallet(ctx: Ctx): WalletClient & {
    account: NonNullable<WalletClient['account']>;
};
export declare function read<T>(ctx: Ctx, call: Call): Promise<T>;
/** Simula primero (para que un revert llegue explicado y sin gastar gas), luego envía y espera el recibo. */
export declare function send(ctx: Ctx, call: Call): Promise<Sent>;
export {};
