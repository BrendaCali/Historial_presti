import { type Address, type Hex } from 'viem';
import { type Ctx, type Sent } from './context.js';
import { type WebAuthnAuth } from './webauthn.js';
/** Límites que el usuario le da a un agente. Los montos van en unidades del token (6 decimales en tUSD). */
export type GrantInput = {
    /** Dirección con la que firma el agente. */
    agent: Address;
    /** ID del agente en ERC-8004 (informativo). */
    agentId?: bigint;
    /** Token que se puede gastar. Por defecto, el dólar de prueba del despliegue. */
    token?: Address;
    maxPerSpend: bigint;
    maxTotal: bigint;
    /** Los gastos mayores a esto esperan la aprobación con passkey del usuario. `null` = nunca piden aprobación. */
    approvalThreshold: bigint | null;
    /** Caducidad como fecha UNIX en segundos, o `expiresIn` en segundos desde ahora. */
    expiresAt?: bigint;
    expiresIn?: number;
    /** Destinatarios permitidos. Vacío o ausente = cualquiera. */
    recipients?: Address[];
};
export type Permit = {
    owner: Address;
    revoked: boolean;
    anyRecipient: boolean;
    spent: bigint;
    terms: {
        agent: Address;
        agentId: bigint;
        token: Address;
        maxPerSpend: bigint;
        maxTotal: bigint;
        approvalThreshold: bigint;
        expiresAt: bigint;
    };
};
/** Recibo de un pago hecho con un permiso, guardado onchain. */
export type Receipt = {
    to: Address;
    permitId: bigint;
    amount: bigint;
    /** 0 si el gasto no necesitó aprobación. */
    requestId: bigint;
    /** Fecha UNIX en segundos. */
    timestamp: bigint;
    ref: Hex;
};
export type SpendRequest = {
    permitId: bigint;
    to: Address;
    amount: bigint;
    /** 0 = ninguno, 1 = pendiente, 2 = ejecutado. */
    status: number;
    ref: Hex;
};
/** Permiso firmado por el usuario, listo para que un relayer lo envíe y pague el gas. */
export type SignedGrant = {
    owner: Address;
    input: ResolvedGrant;
    deadline: bigint;
    signature: Hex;
};
export type SignedRevoke = {
    permitId: bigint;
    deadline: bigint;
    signature: Hex;
};
type ResolvedGrant = {
    agent: Address;
    agentId: bigint;
    token: Address;
    maxPerSpend: bigint;
    maxTotal: bigint;
    approvalThreshold: bigint;
    expiresAt: bigint;
    recipients: Address[];
};
/** Un `ref` corto en texto se convierte a bytes32; un hex de 32 bytes pasa tal cual. */
export declare function toRef(ref?: string | Hex): Hex;
/** Igual que `keccak256(abi.encodePacked(address[]))` del contrato: cada dirección ocupa 32 bytes. */
export declare function recipientsHash(recipients: readonly Address[]): Hex;
export declare function createPermits(ctx: Ctx): {
    /** El usuario crea un permiso desde su cuenta. Devuelve el ID. */
    grant(input: GrantInput): Promise<{
        permitId: bigint;
    } & Sent>;
    /** El usuario firma el permiso sin enviar nada (no necesita MON). Un relayer lo envía con `relayGrant`. */
    signGrant(input: GrantInput, options?: {
        deadline?: bigint;
    }): Promise<SignedGrant>;
    /** Un relayer envía el permiso firmado por el usuario y paga el gas. */
    relayGrant(signed: SignedGrant): Promise<{
        permitId: bigint;
    } & Sent>;
    revoke(permitId: bigint): Promise<Sent>;
    signRevoke(permitId: bigint, options?: {
        deadline?: bigint;
    }): Promise<SignedRevoke>;
    relayRevoke(signed: SignedRevoke): Promise<Sent>;
    /** El agente gasta dentro de los límites y bajo el umbral. */
    spend(input: {
        permitId: bigint;
        to: Address;
        amount: bigint;
        ref?: string | Hex;
    }): Promise<Sent>;
    /** El agente pide un gasto sobre el umbral. Devuelve el `requestId` que el usuario debe aprobar. */
    requestSpend(input: {
        permitId: bigint;
        to: Address;
        amount: bigint;
        ref?: string | Hex;
    }): Promise<{
        requestId: bigint;
    } & Sent>;
    /** Hash que el usuario firma con su passkey para aprobar un pedido. */
    challenge: (requestId: bigint) => Promise<`0x${string}`>;
    /** Pide la huella al usuario y devuelve la aprobación, sin enviarla. */
    signApproval: (requestId: bigint, options?: {
        credentialId?: string;
        rpId?: string;
    }) => Promise<WebAuthnAuth>;
    /** Envía una aprobación ya firmada. Puede hacerlo cualquiera (por ejemplo, un relayer). */
    submitApproval: (requestId: bigint, auth: WebAuthnAuth) => Promise<Sent>;
    /** Pide la huella y ejecuta el gasto pendiente. */
    approve(requestId: bigint, options?: {
        credentialId?: string;
        rpId?: string;
    }): Promise<Sent>;
    /** Permisos que un usuario ha dado, con su ID. */
    listByOwner(owner: Address, options?: {
        limit?: number;
    }): Promise<{
        permitId: bigint;
        permit: Permit;
    }[]>;
    /** Permisos que le dieron a un agente, con su ID. */
    listByAgent(agent: Address, options?: {
        limit?: number;
    }): Promise<{
        permitId: bigint;
        permit: Permit;
    }[]>;
    /** Pedidos de gasto sobre los permisos de un usuario (pendientes, ejecutados o vencidos), con su ID. */
    requestsOf(owner: Address, options?: {
        limit?: number;
    }): Promise<{
        requestId: bigint;
        request: SpendRequest;
    }[]>;
    /** Recibos de los pagos de un usuario. */
    receiptsOf(owner: Address, options?: {
        limit?: number;
    }): Promise<Receipt[]>;
    get(permitId: bigint): Promise<Permit>;
    getRequest(requestId: bigint): Promise<SpendRequest>;
    /** Cuánto queda por gastar (0 si está revocado o vencido). */
    remaining(permitId: bigint): Promise<bigint>;
    isAllowedRecipient(permitId: bigint, to: Address): Promise<boolean>;
    /** Recibo acumulado: cuánto le pagó `client` a `payee` a través de permisos. */
    paidAmount(payee: Address, client: Address): Promise<bigint>;
};
export type Permits = ReturnType<typeof createPermits>;
export {};
