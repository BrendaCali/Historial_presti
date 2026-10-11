/**
 * Formato de transporte: JSON que conserva los `bigint`. Las firmas que se envían a un relayer contienen montos y
 * fechas como `bigint`, que `JSON.stringify` no soporta.
 */
export declare function serialize(value: unknown): string;
/** Inversa de `serialize`. Lanza si el texto no es JSON o si algún `$bigint` no es un entero. */
export declare function deserialize<T = unknown>(text: string): T;
