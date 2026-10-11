import type { Address } from 'viem';
/** Direcciones de los contratos de Aval en una red. */
export type AvalAddresses = {
    chainId: number;
    passkeyRegistry: Address;
    agentPermit: Address;
    reputationReader: Address;
    /** Dólar de prueba, el token por defecto para los permisos. Opcional en otras redes. */
    testUsd?: Address;
    /** Registros oficiales de ERC-8004 (agentes y reputación). Opcionales en otras redes. */
    identityRegistry?: Address;
    reputationRegistry?: Address;
};
/** Registros ERC-8004 oficiales de Monad testnet. */
export declare const erc8004MonadTestnet: {
    readonly identityRegistry: '0x8004A818BFB912233c491871b3d84c89A494BD9e';
    readonly reputationRegistry: '0x8004B663056A597Dffe9eCcC1965A193B7388713';
};
/** Despliegue de Aval en Monad testnet (chain ID 10143). Verificado en Sourcify. */
export declare const monadTestnet: AvalAddresses;
/** Precompile P256 de Monad (EIP-7951). */
export declare const P256_PRECOMPILE: Address;
