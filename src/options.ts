/**
 * Resolve processor defaults.
 */

import { defaultFormatContext } from "./telemetry.js";
import type {
  ResolvedWolbargProcessorOptions,
  WolbargProcessorOptions,
} from "./types.js";

export function resolveOptions(
  options: WolbargProcessorOptions,
): ResolvedWolbargProcessorOptions {
  if (!options?.memory) {
    throw new Error("@wolbarg/mastra: memory is required");
  }
  if (typeof options.agent !== "string" || options.agent.trim().length === 0) {
    throw new Error("@wolbarg/mastra: agent must be a non-empty string");
  }

  const id =
    typeof options.id === "string" && options.id.trim().length > 0
      ? options.id.trim()
      : "wolbarg-memory";

  return {
    memory: options.memory,
    agent: options.agent.trim(),
    id,
    recall: options.recall !== false,
    remember: options.remember !== false,
    topK: options.topK ?? 5,
    metadata: { ...(options.metadata ?? {}) },
    ...(options.sessionId !== undefined ? { sessionId: options.sessionId } : {}),
    ...(options.userId !== undefined ? { userId: options.userId } : {}),
    ...(options.tags !== undefined ? { tags: options.tags } : {}),
    ...(options.namespace !== undefined ? { namespace: options.namespace } : {}),
    injection: options.injection ?? "system",
    formatContext: options.formatContext ?? defaultFormatContext,
    ...(options.onError ? { onError: options.onError } : {}),
    ...(options.onTelemetry ? { onTelemetry: options.onTelemetry } : {}),
  };
}

/** Build remember metadata including session/user/tags/namespace. */
export function buildRememberMetadata(
  options: ResolvedWolbargProcessorOptions,
): Record<string, unknown> {
  const meta: Record<string, unknown> = { ...options.metadata };
  if (options.sessionId !== undefined) meta.sessionId = options.sessionId;
  if (options.userId !== undefined) meta.userId = options.userId;
  if (options.tags !== undefined) meta.tags = options.tags;
  if (options.namespace !== undefined) meta.namespace = options.namespace;
  meta.source = "wolbarg-mastra";
  return meta;
}
