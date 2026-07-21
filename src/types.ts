/**
 * Public types for @wolbarg/mastra processor.
 */

import type { RecallResult, Wolbarg } from "wolbarg";

/** How recalled memory is injected into the Mastra prompt. */
export type InjectionMode = "system" | "message";

export type WolbargProcessorTelemetryEvent = {
  phase: "recall" | "remember" | "inject";
  ok: boolean;
  durationMs?: number;
  hitCount?: number;
  rememberedCount?: number;
  skipped?: boolean;
  reason?: string;
  error?: unknown;
  agent?: string;
  sessionId?: string;
  userId?: string;
};

export type WolbargProcessorOptions = {
  memory: Wolbarg;
  agent: string;

  /** Processor id. Defaults to `"wolbarg-memory"`. */
  id?: string;

  /** Defaults true */
  recall?: boolean;
  /** Defaults true */
  remember?: boolean;

  topK?: number;
  metadata?: Record<string, unknown>;
  sessionId?: string;
  userId?: string;
  tags?: string[];
  namespace?: string;

  /**
   * `"system"` (default) — append memory context to `systemMessages`.
   * `"message"` — prepend a system-role MastraDBMessage with memory text.
   */
  injection?: InjectionMode;

  formatContext?: (hits: RecallResult[]) => string;
  onError?: (error: unknown, phase: "recall" | "remember") => void;
  onTelemetry?: (event: WolbargProcessorTelemetryEvent) => void;
};

export type ResolvedWolbargProcessorOptions = {
  memory: Wolbarg;
  agent: string;
  id: string;
  recall: boolean;
  remember: boolean;
  topK: number;
  metadata: Record<string, unknown>;
  sessionId?: string;
  userId?: string;
  tags?: string[];
  namespace?: string;
  injection: InjectionMode;
  formatContext: (hits: RecallResult[]) => string;
  onError?: (error: unknown, phase: "recall" | "remember") => void;
  onTelemetry?: (event: WolbargProcessorTelemetryEvent) => void;
};
