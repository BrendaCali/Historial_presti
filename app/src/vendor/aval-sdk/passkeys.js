import { passkeyRegistryAbi } from './abi.js';
import { read, requireWallet, send } from './context.js';
const registerTypes = {
    Register: [
        { name: 'owner', type: 'address' },
        { name: 'x', type: 'bytes32' },
        { name: 'y', type: 'bytes32' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
    ],
};
export function createPasskeys(ctx) {
    const address = ctx.addresses.passkeyRegistry;
    const now = () => BigInt(Math.floor(Date.now() / 1000));
    const keyOf = async (owner) => {
        const [x, y] = await read(ctx, {
            address,
            abi: passkeyRegistryAbi,
            functionName: 'keyOf',
            args: [owner],
        });
        const zero = /^0x0+$/;
        return zero.test(x) && zero.test(y) ? null : { x, y };
    };
    return {
        /** Registra o rota la clave P256 de la cuenta que envía la transacción. */
        async register(key) {
            return send(ctx, { address, abi: passkeyRegistryAbi, functionName: 'register', args: [key.x, key.y] });
        },
        /** El usuario firma el registro de su clave sin gastar gas; un relayer lo envía con `relayRegister`. */
        async signRegister(key, options = {}) {
            const wallet = requireWallet(ctx);
            const owner = wallet.account.address;
            const deadline = options.deadline ?? now() + 3600n;
            const nonce = await read(ctx, { address, abi: passkeyRegistryAbi, functionName: 'nonces', args: [owner] });
            const signature = await wallet.signTypedData({
                account: wallet.account,
                domain: {
                    name: 'Aval PasskeyRegistry',
                    version: '1',
                    chainId: ctx.addresses.chainId,
                    verifyingContract: address,
                },
                types: registerTypes,
                primaryType: 'Register',
                message: { owner, x: key.x, y: key.y, nonce, deadline },
            });
            return { owner, key, deadline, signature };
        },
        async relayRegister(signed) {
            return send(ctx, {
                address,
                abi: passkeyRegistryAbi,
                functionName: 'registerFor',
                args: [signed.owner, signed.key.x, signed.key.y, signed.deadline, signed.signature],
            });
        },
        /** Clave P256 registrada de `owner`, o `null` si no tiene. Sirve para reconstruir todo en un dispositivo nuevo. */
        keyOf,
        async has(owner) {
            return (await keyOf(owner)) !== null;
        },
    };
}
//# sourceMappingURL=passkeys.js.map