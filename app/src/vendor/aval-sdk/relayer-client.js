import { AvalError } from './errors.js';
import { deserialize, serialize } from './wire.js';
/**
 * Cliente de un relayer de Aval: le envías lo que el usuario firmó y él paga el gas, así el usuario no necesita MON.
 * El relayer nunca recibe claves privadas, solo firmas que no sirven para nada distinto a lo firmado.
 */
export function createRelayerClient(options) {
    const base = options.url.replace(/\/+$/, '');
    const doFetch = options.fetch ?? ((url, init) => globalThis.fetch(url, init));
    async function call(method, path, body) {
        const response = await doFetch(`${base}${path}`, {
            method,
            headers: body === undefined ? {} : { 'content-type': 'application/json' },
            ...(body === undefined ? {} : { body: serialize(body) }),
        });
        const text = await response.text();
        let data;
        try {
            data = deserialize(text);
        }
        catch {
            throw new AvalError('RelayerBadResponse', `El relayer respondió algo inesperado (HTTP ${response.status}).`);
        }
        if (response.status >= 200 && response.status < 300)
            return data;
        const error = data.error;
        const retry = response.headers.get('retry-after');
        const extra = retry ? ` Reintenta en ${retry} s.` : '';
        throw new AvalError(error?.code ?? `Http${response.status}`, `${error?.message ?? 'El relayer rechazó la solicitud.'}${extra}`, Array.isArray(error?.args) ? error.args : []);
    }
    return {
        health: () => call('GET', '/health'),
        /** Registra la clave P256 del usuario con su firma. */
        register: (signed) => call('POST', '/relay/register', signed),
        /** Crea un permiso con la firma del usuario. */
        grant: (signed) => call('POST', '/relay/grant', signed),
        /** Revoca un permiso con la firma del usuario. */
        revoke: (signed) => call('POST', '/relay/revoke', signed),
        /** Autoriza a AgentPermit a mover un token con la firma ERC-2612 del usuario. */
        tokenPermit: (signed) => call('POST', '/relay/token-permit', signed),
        /** Envía la aprobación con passkey de un gasto pendiente. */
        approve: (requestId, auth) => call('POST', '/relay/approve', { requestId, auth }),
        /**
         * Agente de demostración del relayer: hace de agente de IA del usuario. El usuario le da un permiso (con su
         * dirección `info().address` como agente) y estas acciones muestran qué hace el contrato en cada caso.
         * Solo paga al servicio fijo que indica `info().service`.
         */
        agent: {
            info: () => call('GET', '/agent/info'),
            /** Paga dentro del permiso. Si el monto supera el umbral o los límites, el contrato lo rechaza y el error lo explica. */
            spend: (input) => call('POST', '/agent/spend', input),
            /** Pide un pago que supera el umbral: queda pendiente hasta que el usuario lo apruebe con su huella. */
            request: (input) => call('POST', '/agent/request', input),
            /** Reseña al servicio (de 0 a 100). Solo cuenta en la reputación verificada si el agente ya le pagó. */
            review: (input) => call('POST', '/agent/review', input),
        },
        /** Pide dólares de prueba (tUSD) para una dirección. Tiene tiempo de espera por dirección. */
        faucet: (to) => call('POST', '/faucet', { to }),
    };
}
//# sourceMappingURL=relayer-client.js.map