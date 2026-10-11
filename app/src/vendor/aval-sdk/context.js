import { AvalError, explainError } from './errors.js';
export function requireWallet(ctx) {
    const wallet = ctx.walletClient;
    if (!wallet?.account) {
        throw new AvalError('NoWallet', 'Esta operación necesita un `walletClient` con cuenta.');
    }
    return wallet;
}
export async function read(ctx, call) {
    try {
        return (await ctx.publicClient.readContract(call));
    }
    catch (error) {
        throw explainError(error);
    }
}
/** Simula primero (para que un revert llegue explicado y sin gastar gas), luego envía y espera el recibo. */
export async function send(ctx, call) {
    const wallet = requireWallet(ctx);
    try {
        const { request } = await ctx.publicClient.simulateContract({ ...call, account: wallet.account });
        const hash = await wallet.writeContract(request);
        const receipt = await ctx.publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== 'success')
            throw new AvalError('Reverted', 'La transacción se revirtió en la cadena.');
        return { hash, receipt };
    }
    catch (error) {
        throw explainError(error);
    }
}
//# sourceMappingURL=context.js.map