/**
 * Official Wolbarg ↔ Mastra Processor (recall on input, remember on output).
 *
 * Soft-fails on Wolbarg errors so agent generation never crashes.
 */

import type {
  InputProcessor,
  OutputProcessor,
  ProcessInputArgs,
  ProcessInputResult,
  ProcessOutputResultArgs,
  Processor,
} from "@mastra/core/processors";
import { buildRememberMetadata, resolveOptions } from "./options.js";
import {
  createMemoryDbMessage,
  getLastUserText,
  toConversationMessages,
  type MastraDBMessage,
} from "./messages.js";
import { emitTelemetry } from "./telemetry.js";
import type { WolbargProcessorOptions } from "./types.js";

/**
 * Processor with both recall (`processInput`) and remember (`processOutputResult`)
 * required — assignable to Mastra `inputProcessors` and `outputProcessors`.
 */
export type WolbargMastraProcessor = Processor &
  InputProcessor &
  OutputProcessor & {
    readonly id: string;
    processInput: (
      args: ProcessInputArgs,
    ) => Promise<ProcessInputResult>;
    processOutputResult: (
      args: ProcessOutputResultArgs,
    ) => Promise<MastraDBMessage[]>;
  };

export function createWolbargProcessor(
  options: WolbargProcessorOptions,
): WolbargMastraProcessor {
  const resolved = resolveOptions(options);

  const processor: WolbargMastraProcessor = {
    id: resolved.id,
    name: "Wolbarg Memory",
    description:
      "Recalls Wolbarg shared semantic memory before the LLM and remembers after generation. Soft-fails on Wolbarg errors.",

    async processInput({
      messages,
      systemMessages,
    }: ProcessInputArgs): Promise<ProcessInputResult> {
      if (!resolved.recall) {
        emitTelemetry(resolved.onTelemetry, {
          phase: "recall",
          ok: true,
          skipped: true,
          reason: "recall disabled",
          agent: resolved.agent,
          sessionId: resolved.sessionId,
          userId: resolved.userId,
        });
        return { messages, systemMessages };
      }

      const query = getLastUserText(messages);
      if (!query.trim()) {
        emitTelemetry(resolved.onTelemetry, {
          phase: "recall",
          ok: true,
          skipped: true,
          reason: "no user message",
          agent: resolved.agent,
          sessionId: resolved.sessionId,
          userId: resolved.userId,
        });
        return { messages, systemMessages };
      }

      const started = performance.now();
      try {
        const hits = await resolved.memory.recall({
          query,
          topK: resolved.topK,
          filter: { agent: resolved.agent },
        });

        const text = resolved.formatContext(hits);
        if (!text.trim()) {
          emitTelemetry(resolved.onTelemetry, {
            phase: "recall",
            ok: true,
            durationMs: performance.now() - started,
            hitCount: hits.length,
            agent: resolved.agent,
            sessionId: resolved.sessionId,
            userId: resolved.userId,
          });
          return { messages, systemMessages };
        }

        emitTelemetry(resolved.onTelemetry, {
          phase: "recall",
          ok: true,
          durationMs: performance.now() - started,
          hitCount: hits.length,
          agent: resolved.agent,
          sessionId: resolved.sessionId,
          userId: resolved.userId,
        });

        emitTelemetry(resolved.onTelemetry, {
          phase: "inject",
          ok: true,
          hitCount: hits.length,
          agent: resolved.agent,
        });

        if (resolved.injection === "message") {
          const memoryMessage = createMemoryDbMessage(text);
          return {
            messages: [memoryMessage, ...messages],
            systemMessages,
          };
        }

        // Default: append to systemMessages (preferred Mastra extension point)
        return {
          messages,
          systemMessages: [
            ...systemMessages,
            { role: "system" as const, content: text },
          ],
        };
      } catch (error) {
        emitTelemetry(resolved.onTelemetry, {
          phase: "recall",
          ok: false,
          durationMs: performance.now() - started,
          error,
          agent: resolved.agent,
          sessionId: resolved.sessionId,
          userId: resolved.userId,
        });
        try {
          resolved.onError?.(error, "recall");
        } catch {
          // ignore hook errors
        }
        return { messages, systemMessages };
      }
    },

    async processOutputResult({
      messages,
    }: ProcessOutputResultArgs): Promise<MastraDBMessage[]> {
      if (!resolved.remember) {
        emitTelemetry(resolved.onTelemetry, {
          phase: "remember",
          ok: true,
          skipped: true,
          reason: "remember disabled",
          agent: resolved.agent,
          sessionId: resolved.sessionId,
          userId: resolved.userId,
        });
        return messages;
      }

      const conversation = toConversationMessages(messages);
      const hasUser = conversation.some(
        (m) => m.role === "user" && m.content.trim().length > 0,
      );
      if (!hasUser) {
        emitTelemetry(resolved.onTelemetry, {
          phase: "remember",
          ok: true,
          skipped: true,
          reason: "no user messages",
          agent: resolved.agent,
        });
        return messages;
      }

      const started = performance.now();
      try {
        const results = await resolved.memory.rememberFromMessages(conversation, {
          agent: resolved.agent,
          mode: "raw",
          rawStrategy: "last_user",
          metadata: buildRememberMetadata(resolved),
        });

        emitTelemetry(resolved.onTelemetry, {
          phase: "remember",
          ok: true,
          durationMs: performance.now() - started,
          rememberedCount: results.length,
          agent: resolved.agent,
          sessionId: resolved.sessionId,
          userId: resolved.userId,
        });
      } catch (error) {
        emitTelemetry(resolved.onTelemetry, {
          phase: "remember",
          ok: false,
          durationMs: performance.now() - started,
          error,
          agent: resolved.agent,
          sessionId: resolved.sessionId,
          userId: resolved.userId,
        });
        try {
          resolved.onError?.(error, "remember");
        } catch {
          // ignore
        }
      }

      return messages;
    },
  };

  return processor;
}

/** Alias of {@link createWolbargProcessor}. */
export const wolbargProcessor = createWolbargProcessor;
