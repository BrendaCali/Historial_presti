import { hexToSignature } from 'viem';
import { testUsdAbi } from './abi.js';
import { read, requireWallet, send } from './context.js';
import { AvalError } from './errors.js';
const permitTypes = {
    Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
    ],
};
/**
 * Autorizar a AgentPermit a mover un token sin gas: el usuario firma (ERC-2612) y un relayer envía.
 * Sin esto, el usuario necesitaría MON para hacer `approve`.
 */
export function createTokens(ctx) {
    const spender = ctx.addresses.agentPermit;
    const now = () => BigInt(Math.floor(Date.now() / 1000));
    const tokenOrDefault = (token) => {
        const t = token ?? ctx.addresses.testUsd;
        if (!t)
            throw new AvalError('NoToken', 'Indica el `token`: esta red no tiene dólar de prueba.');
        return t;
    };
    return {
        /** El usuario firma la autorización de gasto para AgentPermit. */
        async signPermit(input, options = {}) {
            const wallet = requireWallet(ctx);
            const token = tokenOrDefault(input.token);
            const owner = wallet.account.address;
            const deadline = options.deadline ?? now() + 3600n;
            const [name, nonce] = await Promise.all([
                read(ctx, { address: token, abi: testUsdAbi, functionName: 'name' }),
                read(ctx, { address: token, abi: testUsdAbi, functionName: 'nonces', args: [owner] }),
            ]);
            const signature = await wallet.signTypedData({
                account: wallet.account,
                domain: { name, version: '1', chainId: ctx.addresses.chainId, verifyingContract: token },
                types: permitTypes,
                primaryType: 'Permit',
                message: { owner, spender, value: input.value, nonce, deadline },
            });
            return { token, owner, value: input.value, deadline, signature };
        },
        /** Un relayer envía la autorización firmada y paga el gas. */
        async relayPermit(signed) {
            const { r, s, v, yParity } = hexToSignature(signed.signature);
            return send(ctx, {
                address: signed.token,
                abi: testUsdAbi,
                functionName: 'permit',
                args: [signed.owner, spender, signed.value, signed.deadline, Number(v ?? 27n + BigInt(yParity)), r, s],
            });
        },
        /** Autoriza a AgentPermit enviando la transacción desde la cuenta del usuario (necesita MON). */
        async approve(input) {
            return send(ctx, {
                address: tokenOrDefault(input.token),
                abi: testUsdAbi,
                functionName: 'approve',
                args: [spender, input.value],
            });
        },
        async balanceOf(owner, token) {
            return read(ctx, {
                address: tokenOrDefault(token),
                abi: testUsdAbi,
                functionName: 'balanceOf',
                args: [owner],
            });
        },
        /** Pide dólares de prueba (solo testnet, hasta 1.000 por llamada). */
        async faucet(input) {
            return send(ctx, {
                address: tokenOrDefault(),
                abi: testUsdAbi,
                functionName: 'faucet',
                args: [input.to, input.amount],
            });
        },
    };
}
//# sourceMappingURL=tokens.js.map