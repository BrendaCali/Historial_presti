import { concat, hexToBytes, isHex, keccak256, pad, parseEventLogs, stringToHex, } from 'viem';
import { agentPermitAbi } from './abi.js';
import { read, requireWallet, send } from './context.js';
import { AvalError } from './errors.js';
import { buildAuth } from './webauthn.js';
const MAX_UINT128 = (1n << 128n) - 1n;
const grantTypes = {
    Grant: [
        { name: 'owner', type: 'address' },
        { name: 'agent', type: 'address' },
        { name: 'agentId', type: 'uint256' },
        { name: 'token', type: 'address' },
        { name: 'maxPerSpend', type: 'uint128' },
        { name: 'maxTotal', type: 'uint128' },
        { name: 'approvalThreshold', type: 'uint128' },
        { name: 'expiresAt', type: 'uint64' },
        { name: 'recipientsHash', type: 'bytes32' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
    ],
};
const revokeTypes = {
    Revoke: [
        { name: 'permitId', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
    ],
};
/** Un `ref` corto en texto se convierte a bytes32; un hex de 32 bytes pasa tal cual. */
export function toRef(ref) {
    if (ref === undefined || ref === '')
        return pad('0x', { size: 32 });
    if (isHex(ref) && ref.length === 66)
        return ref;
    if (new TextEncoder().encode(ref).length > 32)
        throw new AvalError('RefTooLong', 'La referencia debe caber en 32 bytes.');
    return stringToHex(ref, { size: 32 });
}
/** Igual que `keccak256(abi.encodePacked(address[]))` del contrato: cada dirección ocupa 32 bytes. */
export function recipientsHash(recipients) {
    return keccak256(concat(recipients.map((a) => pad(a, { size: 32 }))));
}
export function createPermits(ctx) {
    const address = ctx.addresses.agentPermit;
    const now = () => BigInt(Math.floor(Date.now() / 1000));
    const resolve = (input) => {
        const token = input.token ?? ctx.addresses.testUsd;
        if (!token)
            throw new AvalError('NoToken', 'Indica el `token` del permiso: esta red no tiene dólar de prueba.');
        if (input.expiresAt === undefined && input.expiresIn === undefined) {
            throw new AvalError('NoExpiry', 'Indica `expiresIn` (segundos) o `expiresAt` (fecha UNIX).');
        }
        return {
            agent: input.agent,
            agentId: input.agentId ?? 0n,
            token,
            maxPerSpend: input.maxPerSpend,
            maxTotal: input.maxTotal,
            approvalThreshold: input.approvalThreshold === null ? MAX_UINT128 : input.approvalThreshold,
            expiresAt: input.expiresAt ?? now() + BigInt(input.expiresIn),
            recipients: input.recipients ?? [],
        };
    };
    const termsOf = (g) => ({
        agent: g.agent,
        agentId: g.agentId,
        token: g.token,
        maxPerSpend: g.maxPerSpend,
        maxTotal: g.maxTotal,
        approvalThreshold: g.approvalThreshold,
        expiresAt: g.expiresAt,
    });
    const domain = () => ({
        name: 'Aval AgentPermit',
        version: '1',
        chainId: ctx.addresses.chainId,
        verifyingContract: address,
    });
    const nonceOf = (owner) => read(ctx, { address, abi: agentPermitAbi, functionName: 'nonces', args: [owner] });
    const idFrom = (sent) => {
        const [log] = parseEventLogs({ abi: agentPermitAbi, logs: sent.receipt.logs, eventName: 'PermitGranted' });
        if (!log)
            throw new AvalError('NoEvent', 'No se encontró el evento PermitGranted en el recibo.');
        return log.args.permitId;
    };
    const get = (permitId) => read(ctx, { address, abi: agentPermitAbi, functionName: 'getPermit', args: [permitId] });
    /** Lee los últimos `limit` IDs de un índice por usuario: primero cuántos hay, luego la última página. */
    const latest = async (to, countFn, idsFn, who, limit = 50) => {
        const max = BigInt(limit);
        const count = await read(ctx, { address: to, abi: agentPermitAbi, functionName: countFn, args: [who] });
        const offset = count > max ? count - max : 0n;
        const ids = await read(ctx, {
            address: to,
            abi: agentPermitAbi,
            functionName: idsFn,
            args: [who, offset, max],
        });
        return [...ids];
    };
    const challenge = (requestId) => read(ctx, { address, abi: agentPermitAbi, functionName: 'approvalChallenge', args: [requestId] });
    const signApproval = async (requestId, options = {}) => {
        const assertion = await ctx.assertionProvider({
            ...options,
            challenge: hexToBytes(await challenge(requestId)),
        });
        return buildAuth(assertion);
    };
    const submitApproval = (requestId, auth) => send(ctx, { address, abi: agentPermitAbi, functionName: 'approveSpend', args: [requestId, auth] });
    return {
        // ----------------------------------------------------------- el usuario crea y revoca
        /** El usuario crea un permiso desde su cuenta. Devuelve el ID. */
        async grant(input) {
            const g = resolve(input);
            const sent = await send(ctx, {
                address,
                abi: agentPermitAbi,
                functionName: 'grant',
                args: [termsOf(g), g.recipients],
            });
            return { permitId: idFrom(sent), ...sent };
        },
        /** El usuario firma el permiso sin enviar nada (no necesita MON). Un relayer lo envía con `relayGrant`. */
        async signGrant(input, options = {}) {
            const wallet = requireWallet(ctx);
            const g = resolve(input);
            const owner = wallet.account.address;
            const deadline = options.deadline ?? now() + 3600n;
            const signature = await wallet.signTypedData({
                account: wallet.account,
                domain: domain(),
                types: grantTypes,
                primaryType: 'Grant',
                message: {
                    owner,
                    agent: g.agent,
                    agentId: g.agentId,
                    token: g.token,
                    maxPerSpend: g.maxPerSpend,
                    maxTotal: g.maxTotal,
                    approvalThreshold: g.approvalThreshold,
                    expiresAt: g.expiresAt,
                    recipientsHash: recipientsHash(g.recipients),
                    nonce: await nonceOf(owner),
                    deadline,
                },
            });
            return { owner, input: g, deadline, signature };
        },
        /** Un relayer envía el permiso firmado por el usuario y paga el gas. */
        async relayGrant(signed) {
            const sent = await send(ctx, {
                address,
                abi: agentPermitAbi,
                functionName: 'grantBySig',
                args: [signed.owner, termsOf(signed.input), signed.input.recipients, signed.deadline, signed.signature],
            });
            return { permitId: idFrom(sent), ...sent };
        },
        async revoke(permitId) {
            return send(ctx, { address, abi: agentPermitAbi, functionName: 'revoke', args: [permitId] });
        },
        async signRevoke(permitId, options = {}) {
            const wallet = requireWallet(ctx);
            const deadline = options.deadline ?? now() + 3600n;
            const signature = await wallet.signTypedData({
                account: wallet.account,
                domain: domain(),
                types: revokeTypes,
                primaryType: 'Revoke',
                message: { permitId, nonce: await nonceOf(wallet.account.address), deadline },
            });
            return { permitId, deadline, signature };
        },
        async relayRevoke(signed) {
            return send(ctx, {
                address,
                abi: agentPermitAbi,
                functionName: 'revokeBySig',
                args: [signed.permitId, signed.deadline, signed.signature],
            });
        },
        // ----------------------------------------------------------- el agente gasta
        /** El agente gasta dentro de los límites y bajo el umbral. */
        async spend(input) {
            return send(ctx, {
                address,
                abi: agentPermitAbi,
                functionName: 'spend',
                args: [input.permitId, input.to, input.amount, toRef(input.ref)],
            });
        },
        /** El agente pide un gasto sobre el umbral. Devuelve el `requestId` que el usuario debe aprobar. */
        async requestSpend(input) {
            const sent = await send(ctx, {
                address,
                abi: agentPermitAbi,
                functionName: 'requestSpend',
                args: [input.permitId, input.to, input.amount, toRef(input.ref)],
            });
            const [log] = parseEventLogs({ abi: agentPermitAbi, logs: sent.receipt.logs, eventName: 'SpendRequested' });
            if (!log)
                throw new AvalError('NoEvent', 'No se encontró el evento SpendRequested en el recibo.');
            return { requestId: log.args.requestId, ...sent };
        },
        // ----------------------------------------------------------- el usuario aprueba con su passkey
        /** Hash que el usuario firma con su passkey para aprobar un pedido. */
        challenge,
        /** Pide la huella al usuario y devuelve la aprobación, sin enviarla. */
        signApproval,
        /** Envía una aprobación ya firmada. Puede hacerlo cualquiera (por ejemplo, un relayer). */
        submitApproval,
        /** Pide la huella y ejecuta el gasto pendiente. */
        async approve(requestId, options = {}) {
            return submitApproval(requestId, await signApproval(requestId, options));
        },
        // ----------------------------------------------------------- consultas
        // ----------------------------------------------------------- listados (sin indexador)
        //
        // Los RPC públicos de Monad limitan `eth_getLogs` a 100 bloques, así que el estado de un usuario no se puede
        // reconstruir leyendo eventos. Los contratos guardan índices por usuario y por agente: estos métodos leen los
        // últimos `limit` (50 por defecto), del más antiguo al más nuevo.
        /** Permisos que un usuario ha dado, con su ID. */
        async listByOwner(owner, options = {}) {
            const ids = await latest(address, 'permitCountOf', 'permitIdsOf', owner, options.limit);
            return Promise.all(ids.map(async (permitId) => ({ permitId, permit: await get(permitId) })));
        },
        /** Permisos que le dieron a un agente, con su ID. */
        async listByAgent(agent, options = {}) {
            const ids = await latest(address, 'agentPermitCount', 'agentPermitIds', agent, options.limit);
            return Promise.all(ids.map(async (permitId) => ({ permitId, permit: await get(permitId) })));
        },
        /** Pedidos de gasto sobre los permisos de un usuario (pendientes, ejecutados o vencidos), con su ID. */
        async requestsOf(owner, options = {}) {
            const ids = await latest(address, 'requestCountOf', 'requestIdsOf', owner, options.limit);
            return Promise.all(ids.map(async (requestId) => ({
                requestId,
                request: await read(ctx, { address, abi: agentPermitAbi, functionName: 'getRequest', args: [requestId] }),
            })));
        },
        /** Recibos de los pagos de un usuario. */
        async receiptsOf(owner, options = {}) {
            const limit = BigInt(options.limit ?? 50);
            const count = await read(ctx, { address, abi: agentPermitAbi, functionName: 'receiptCountOf', args: [owner] });
            const offset = count > limit ? count - limit : 0n;
            const raw = await read(ctx, {
                address,
                abi: agentPermitAbi,
                functionName: 'receiptsOf',
                args: [owner, offset, limit],
            });
            return raw.map((r) => ({ ...r }));
        },
        async get(permitId) {
            return read(ctx, { address, abi: agentPermitAbi, functionName: 'getPermit', args: [permitId] });
        },
        async getRequest(requestId) {
            return read(ctx, { address, abi: agentPermitAbi, functionName: 'getRequest', args: [requestId] });
        },
        /** Cuánto queda por gastar (0 si está revocado o vencido). */
        async remaining(permitId) {
            return read(ctx, { address, abi: agentPermitAbi, functionName: 'remaining', args: [permitId] });
        },
        async isAllowedRecipient(permitId, to) {
            return read(ctx, { address, abi: agentPermitAbi, functionName: 'isAllowedRecipient', args: [permitId, to] });
        },
        /** Recibo acumulado: cuánto le pagó `client` a `payee` a través de permisos. */
        async paidAmount(payee, client) {
            return read(ctx, { address, abi: agentPermitAbi, functionName: 'paidAmount', args: [payee, client] });
        },
    };
}
//# sourceMappingURL=permits.js.map