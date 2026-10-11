/** Error de Aval con un mensaje en español y el nombre del error del contrato, si lo hay. */
export declare class AvalError extends Error {
    readonly code: string;
    readonly args: readonly unknown[];
    constructor(code: string, message: string, args?: readonly unknown[], options?: {
        cause?: unknown;
    });
}
/** Convierte cualquier error de viem en un `AvalError` legible. Los que no son de contrato pasan igual. */
export declare function explainError(error: unknown): unknown;
