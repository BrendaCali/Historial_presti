# A loan assistant built with Qwen 3.8 Max that cannot read your conversations

> **BORRADOR.** Completa los `[COMPLETAR …]` después de probar con Qwen real (hoy el asistente corre en modo simulado hasta que se pongan `DASHSCOPE_API_KEY` y `QWEN_MODEL` en Vercel). No publiques el artículo sin probar y sin capturas reales. Publícalo en dev.to, Medium o el blog del equipo y pon el enlace en el formulario de la bounty.

*Preste, built on Aval, for Monad Metropolis · Track 4*

## The problem

In Bolivia, millions of loans happen face to face, on trust alone. Trust leaves no trace: someone who has paid on time for years cannot prove it, and someone who defaults can simply move to another circle. **Preste** turns those loans into a verifiable history. You sign in with a fingerprint, post or request a loan, agree on the terms, receive and repay in installments, and rate each other in person.

A marketplace is useful, but scrolling it is slow. People do not think in filters; they think "I need 200 bolivianos for a month" or "what can I get with 30 dollars?". That is where an agent earns its place.

## Why an agent and not a search box

The assistant in Preste does real work with real data:

- It **plans** a short sequence of steps instead of answering from memory.
- It **calls tools** that read and change the live marketplace.
- It **converts currency** (bolivianos and US dollars) and explains the result.

We use **Qwen 3.8 Max** through Alibaba Cloud Model Studio's OpenAI-compatible API (`/compatible-mode/v1/chat/completions`) with function calling.

## The tools

All tools run on the server. The model never touches the database; it only asks for tools.

| Tool | What it does | Needs a spending permission? |
|---|---|---|
| `buscar_ofertas` | Finds open offers and requests that fit a budget and a currency (BOB or USD), a maximum term and a maximum rate | **No** |
| `mi_resumen` | Summarizes the user's balance and the deals that need their attention | **No** |
| `me_interesa` | Shows interest in a post, only if the user explicitly asks | **No** |
| `consultar_permiso`, `pagar`, `pedir_aprobacion` | Optional **authorized payments** with Aval: pay small amounts within limits; larger ones wait for the user's fingerprint | Yes, and only if the user turns it on |

Each tool has a JSON schema, so the model knows exactly what it can ask for:

```js
fn('buscar_ofertas', 'Searches open posts that fit a budget and a currency.', {
  presupuesto: { type: 'number' },
  moneda: { type: 'string', enum: ['BOB', 'USD'] },
  tipo: { type: 'string', enum: ['oferta', 'solicitud'] },
  plazo_max_dias: { type: 'number' },
  tasa_max_mensual: { type: 'number' },
})
```

A key design decision: **looking up prices must never require permission to spend**. Consulting is read-only; only paying needs a permission with limits, and that lives in a separate, optional panel.

## The loop

Each message goes to Qwen with the conversation and the tools. If the model answers with `tool_calls`, the server runs each one, returns the result as a `tool` message, and asks again, up to six steps. The final answer comes with the steps it took, which the interface shows under "What it did". When the tool is `buscar_ofertas`, the results are rendered as cards that open the post.

```js
for (let i = 0; i < MAX_PASOS; i++) {
  const m = await llamarQwen(mensajes, herramientas);
  if (!m.tool_calls?.length) return { respuesta: m.content, pasos };
  mensajes.push(m);
  for (const llamada of m.tool_calls) {
    const resultado = await ejecutar(llamada.function.name, JSON.parse(llamada.function.arguments), ctx);
    pasos.push({ herramienta: llamada.function.name, resultado });
    mensajes.push({ role: 'tool', tool_call_id: llamada.id, content: JSON.stringify(resultado) });
  }
}
```

**[COMPLETAR: pega aquí una captura real de "Busca préstamos con 30 dólares" mostrando los pasos y las tarjetas, y un ejemplo de una conversación de dos o tres pasos.]**

## Who is asking? Signed requests

Every request to the assistant is **signed with the user's account**. Preste derives that account from a passkey with **Mera** (`@category-labs/mera`), and the signing session lives in memory, so signing needs no fingerprint prompt. The server recovers the address from the signature (`recoverMessageAddress` from viem), so tools like `mi_resumen` know whose account to read without passwords or tokens.

## A memory the server cannot read

An assistant that remembers is more useful, but a conversation about money is private. So the memory is **encrypted in the browser with keys derived from the passkey**:

- From the same passkey, **HKDF-SHA256** derives two independent values with different labels: an **AES-GCM** key (`preste/memoria/clave/v1`) and an anonymous storage id (`preste/memoria/id/v1`) that is not the account address.
- The browser encrypts the conversation and stores it in a private **Vercel Blob** store under that id.
- The server only holds `{id, iv, ciphertext}`. On a new device, the same passkey derives the same keys and the memory comes back.

One honest limit: while a message is being answered, its text does pass through our server to reach Qwen. It is not stored there in the clear, but this is not end-to-end encryption with the model.

## What Qwen added

**[COMPLETAR después de probar con Qwen real. Ejemplos de cosas que se pueden medir y contar con honestidad:]**

- Understanding free-form requests ("hasta 200 Bs a 30 días", "30 dólares", "qué me toca hacer") without a rigid form.
- Picking the right tool and arguments, including converting dollars to bolivianos.
- Comparing options and explaining them in plain Spanish.
- Where it failed or needed a stricter prompt, and what we changed.

For development and tests we also built a rule-based planner with the same tools, clearly labeled "simulated (not Qwen)" in the interface, so the full flow could be tested before the model key was available.

## Stack

Next.js 16 · React 19 · `@category-labs/mera` · viem · `@scure/bip32` / `bip39` · Web Crypto (HKDF, AES-GCM) · Vercel Blob · Alchemy (RPC, `alchemy_getAssetTransfers`) · Aval (PasskeyRegistry, AgentPermit, ReputationReader on Monad testnet) · Qwen 3.8 Max (Alibaba Cloud Model Studio).

## Try it and read the code

- Live app: https://app-wheat-eta-38.vercel.app
- App code: https://github.com/BrendaCali/Historial_presti (`app/src/app/api/agente/route.js`)
- Protocol: https://github.com/Alan021011/Aval

*All money in the app is test money on Monad testnet. This is a prototype.*
