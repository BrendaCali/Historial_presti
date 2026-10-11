/** Registros ERC-8004 oficiales de Monad testnet. */
export const erc8004MonadTestnet = {
    identityRegistry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
    reputationRegistry: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
};
/** Despliegue de Aval en Monad testnet (chain ID 10143). Verificado en Sourcify. */
export const monadTestnet = {
    chainId: 10143,
    passkeyRegistry: '0x0C46E673C0f852920e9F15902B0859358Eb53789',
    agentPermit: '0x00F0C1b1FB751c380dF0132001eab6ca110Fc2DA',
    reputationReader: '0x831EeA5808B40C2f1fE49d817B056D3d54E685D6',
    testUsd: '0xeD4Bb1e1926441461BcADA4BBF647Aba8574B3C5',
    identityRegistry: erc8004MonadTestnet.identityRegistry,
    reputationRegistry: erc8004MonadTestnet.reputationRegistry,
};
/** Precompile P256 de Monad (EIP-7951). */
export const P256_PRECOMPILE = '0x0000000000000000000000000000000000000100';
//# sourceMappingURL=addresses.js.map