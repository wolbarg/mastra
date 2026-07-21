# @wolbarg/mastra

[![npm version](https://img.shields.io/npm/v/@wolbarg/mastra.svg)](https://www.npmjs.com/package/@wolbarg/mastra)
[![GitHub](https://img.shields.io/badge/github-wolbarg%2Fmastra-black?logo=github)](https://github.com/wolbarg/mastra)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Official [Mastra](https://mastra.ai/) **Processor** for [Wolbarg](https://wolbarg.com) shared semantic memory.

Automatically:

1. **Recalls** relevant memories in `processInput` (from the last user text in `content.parts`)
2. **Injects** them as a system message (preferred) or a prepended memory message
3. **Remembers** the conversation in `processOutputResult` via `rememberFromMessages`

This is **not** a Mastra Storage / Memory rewrite. Keep [Mastra Memory](https://mastra.ai/docs/memory/overview) for thread history if you want it; add this processor for **shared semantic memory across agents**.

Requires **`@mastra/core` ≥ 1.0** (Processor API; tested against ~1.51).

## Install

```bash
npm install wolbarg @wolbarg/mastra @mastra/core
```

Peers: `wolbarg >= 0.5.4`, `@mastra/core >= 1.0.0`. Optional peer: `@mastra/memory` (thread history only — not required by this package). Node **≥ 22**.

## Quick start

```ts
import { Agent } from "@mastra/core/agent";
import { wolbarg, sqlite, openaiEmbedding } from "wolbarg";
import { createWolbargProcessor } from "@wolbarg/mastra";

const memory = wolbarg({
  organization: "my-app",
  storage: sqlite("./memory.db"),
  embedding: openaiEmbedding({
    apiKey: process.env.OPENAI_API_KEY!,
    model: "text-embedding-3-small",
  }),
});
await memory.ready();

// One instance for both input + output hooks
const wolbargMem = createWolbargProcessor({
  memory,
  agent: "assistant",
  sessionId: "optional-session",
});

const agent = new Agent({
  id: "assistant",
  name: "Assistant",
  instructions: "You are a helpful assistant.",
  model: "openai/gpt-4.1-mini",
  inputProcessors: [wolbargMem],
  outputProcessors: [wolbargMem],
});

const result = await agent.generate("What UI theme do I prefer?");
console.log(result.text);
```

Alias: `wolbargProcessor` === `createWolbargProcessor`.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `memory` | — | Wolbarg instance (**required**) |
| `agent` | — | Agent id for recall filter / remember (**required**) |
| `id` | `"wolbarg-memory"` | Processor `id` |
| `recall` | `true` | Run recall in `processInput` |
| `remember` | `true` | Run remember in `processOutputResult` |
| `topK` | `5` | Recall hit count |
| `injection` | `"system"` | `"system"` appends to `systemMessages`; `"message"` prepends a system-role MastraDBMessage |
| `sessionId` / `userId` / `tags` / `namespace` | — | Stored on remember metadata |
| `metadata` | `{}` | Extra remember metadata (`source: "wolbarg-mastra"` always set) |
| `formatContext` | default bullet list | Format recall hits into prompt text |
| `onError` | — | `(error, phase) => void` |
| `onTelemetry` | — | Soft telemetry events for recall / inject / remember |

## Behavior notes

| Topic | Behavior |
| --- | --- |
| Recall / remember failures | Soft-fail — never crash agent generation (`onError` / `onTelemetry`) |
| Text extraction | Iterates `content.parts` where `type === "text"` |
| `processInput` return | Prefers `{ messages, systemMessages }` |
| `processOutputResult` | Calls `rememberFromMessages` then returns `messages` unchanged |
| Mastra Memory | Orthogonal — keep for threads; Wolbarg for shared semantic memory |

## Type caveats (@mastra/core ~1.51)

- `MastraDBMessage` text lives in `content.parts` (`format: 2`), not a top-level string.
- `processInput` may return `{ messages, systemMessages }` — we prefer that over mutating `MessageList`.
- Mastra's `inputProcessors` / `outputProcessors` expect `InputProcessor` / `OutputProcessor` (methods **required** via `WithRequired`). `createWolbargProcessor` returns `WolbargMastraProcessor` so one instance is assignable to both arrays.
- Put the same processor instance in **both** `inputProcessors` and `outputProcessors` — Mastra runs input hooks and output hooks from separate lists.
- Optional peer `@mastra/memory` is for thread history only; this package does not import it.

## With Mastra Memory (optional)

```ts
import { Memory } from "@mastra/memory";

const agent = new Agent({
  // ...
  memory: new Memory({ /* thread / working memory */ }),
  inputProcessors: [wolbargMem],
  outputProcessors: [wolbargMem],
});
```

Mastra Memory handles conversation threads. Wolbarg handles cross-agent semantic recall.

## Configuration

Required: `memory`, `agent`. Optional: `topK`, `recall`/`remember` toggles, `injection`, session/user scoping, `formatContext`, `onError` / `onTelemetry`.

## Production Notes

- Soft-fail — never crash agent generation; wire `onError` / `onTelemetry`.
- Reuse **one** processor instance in both `inputProcessors` and `outputProcessors`.
- Keep Mastra Memory/Storage for thread history; use Wolbarg for shared semantic memory across agents/processes.
- Provenance: `source: "wolbarg-mastra"`.

## Limitations

- Not a Mastra Storage or Vector backend — do not pass Wolbarg as `storage:` / `vector:`.
- Text extraction only reads `content.parts` with `type === "text"`.
- Does not replace Observational Memory or working-memory Markdown blocks.

## Migration Guide

| From | To |
| --- | --- |
| Mastra `semanticRecall` + vector store for shared facts | Add `createWolbargProcessor` alongside existing Memory |
| Manual recall/remember in tools | Prefer the processor; keep tools for explicit agent-driven writes |

## Examples

Package: `examples/` (minimal, streaming, chatbot, multi-agent, persistence, memory-recall, long-conversation).

Repo adapter: `examples/adapters/mastra/`.

## Docs

https://wolbarg.com/docs/integrations/mastra

## License

MIT
