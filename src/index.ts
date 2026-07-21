/**
 * @wolbarg/mastra — Official Mastra Processor for Wolbarg shared memory.
 *
 * Requires `@mastra/core` **≥1.0** (Processor API).
 *
 * Prefer keeping Mastra Memory for thread history and adding this processor
 * for shared semantic memory across agents.
 *
 * @example
 * ```ts
 * import { Agent } from "@mastra/core/agent";
 * import { createWolbargProcessor } from "@wolbarg/mastra";
 *
 * const agent = new Agent({
 *   id: "assistant",
 *   model: "openai/gpt-4.1-mini",
 *   inputProcessors: [
 *     createWolbargProcessor({ memory, agent: "assistant" }),
 *   ],
 *   outputProcessors: [
 *     createWolbargProcessor({ memory, agent: "assistant" }),
 *   ],
 * });
 * ```
 *
 * Tip: reuse one processor instance for both input and output:
 * ```ts
 * const wolbarg = createWolbargProcessor({ memory, agent: "assistant" });
 * const agent = new Agent({
 *   inputProcessors: [wolbarg],
 *   outputProcessors: [wolbarg],
 *   // ...
 * });
 * ```
 *
 * @packageDocumentation
 */

export {
  createWolbargProcessor,
  wolbargProcessor,
  type WolbargMastraProcessor,
} from "./processor.js";
export { defaultFormatContext } from "./telemetry.js";
export {
  WOLBARG_MEMORY_CONTENT_MARKER,
  WOLBARG_INJECTED_MEMORY_KEY,
  isInjectedMemoryText,
} from "./markers.js";

export type {
  WolbargProcessorOptions,
  WolbargProcessorTelemetryEvent,
  InjectionMode,
  ResolvedWolbargProcessorOptions,
} from "./types.js";
