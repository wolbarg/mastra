/**
 * Test doubles for Wolbarg + fake MastraDBMessage shapes.
 */

import type { ConversationMessage, RecallResult, RememberResult } from "wolbarg";
import type { MastraDBMessage } from "../../src/messages.js";

export type MockMemoryCalls = {
  recalls: Array<{ query: string; filter?: unknown; topK?: number }>;
  remembers: Array<{
    messages: ConversationMessage[];
    options: unknown;
  }>;
};

export function createMockMemory(options?: {
  hits?: RecallResult[];
  recallError?: Error;
  rememberError?: Error;
  rememberResults?: RememberResult[];
}): {
  memory: {
    recall: (opts: {
      query: string;
      topK?: number;
      threshold?: number;
      filter?: unknown;
    }) => Promise<RecallResult[]>;
    rememberFromMessages: (
      messages: ConversationMessage[],
      opts: unknown,
    ) => Promise<RememberResult[]>;
  };
  calls: MockMemoryCalls;
} {
  const calls: MockMemoryCalls = { recalls: [], remembers: [] };
  const hits = options?.hits ?? [];

  return {
    calls,
    memory: {
      async recall(opts) {
        calls.recalls.push({
          query: opts.query,
          filter: opts.filter,
          topK: opts.topK,
        });
        if (options?.recallError) throw options.recallError;
        return hits;
      },
      async rememberFromMessages(messages, opts) {
        calls.remembers.push({ messages, options: opts });
        if (options?.rememberError) throw options.rememberError;
        return (
          options?.rememberResults ??
          messages
            .filter((m) => m.role === "user")
            .map((m, i) => ({
              id: `mem-${i}`,
              organization: "test",
              agent: "assistant",
              content: { text: m.content },
              metadata: {},
              archived: false,
              compressedInto: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              action: "created" as const,
            }))
        );
      },
    },
  };
}

export function fakeDbMessage(
  role: "user" | "assistant" | "system",
  text: string,
  id = `msg-${role}-${Math.random().toString(36).slice(2, 8)}`,
): MastraDBMessage {
  return {
    id,
    role,
    createdAt: new Date(),
    content: {
      format: 2,
      parts: [{ type: "text", text }],
    },
  };
}

export function fakeHit(text: string, id = "hit-1"): RecallResult {
  return {
    id,
    organization: "test",
    agent: "assistant",
    content: { text },
    metadata: {},
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    similarity: 0.9,
  };
}

/** Minimal ProcessInputArgs stub — only fields the processor reads. */
export function fakeProcessInputArgs(messages: MastraDBMessage[], systemMessages: Array<{ role: "system"; content: string }> = []) {
  return {
    messages,
    systemMessages,
    messageList: {} as never,
    state: {},
    retryCount: 0,
    abort: (() => {
      throw new Error("abort");
    }) as never,
  };
}

export function fakeProcessOutputArgs(messages: MastraDBMessage[]) {
  return {
    messages,
    messageList: {} as never,
    state: {},
    retryCount: 0,
    abort: (() => {
      throw new Error("abort");
    }) as never,
    result: {
      text: "",
      usage: {} as never,
      finishReason: "stop",
      steps: [],
    },
  };
}
