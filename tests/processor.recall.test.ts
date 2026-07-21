import { describe, expect, it, vi } from "vitest";
import type { Wolbarg } from "wolbarg";
import type { ProcessInputResult } from "@mastra/core/processors";
import { createWolbargProcessor, WOLBARG_MEMORY_CONTENT_MARKER } from "../src/index.js";
import {
  createMockMemory,
  fakeDbMessage,
  fakeHit,
  fakeProcessInputArgs,
} from "./helpers/mock-memory.js";

function asInputWithSystem(
  result: ProcessInputResult | undefined | void,
): {
  messages: ReturnType<typeof fakeDbMessage>[];
  systemMessages: Array<{ role: string; content: string }>;
} {
  if (
    !result ||
    Array.isArray(result) ||
    typeof result !== "object" ||
    !("systemMessages" in result) ||
    !("messages" in result)
  ) {
    throw new Error("expected { messages, systemMessages }");
  }
  return result as {
    messages: ReturnType<typeof fakeDbMessage>[];
    systemMessages: Array<{ role: string; content: string }>;
  };
}

describe("createWolbargProcessor processInput", () => {
  it("recalls from last user text and appends to systemMessages", async () => {
    const { memory, calls } = createMockMemory({
      hits: [fakeHit("User prefers dark mode")],
    });

    const processor = createWolbargProcessor({
      memory: memory as unknown as Wolbarg,
      agent: "assistant",
      topK: 3,
    });

    const messages = [
      fakeDbMessage("user", "earlier"),
      fakeDbMessage("assistant", "ok"),
      fakeDbMessage("user", "What theme do I prefer?"),
    ];

    const result = asInputWithSystem(
      await processor.processInput!(
        fakeProcessInputArgs(messages, [{ role: "system", content: "Be helpful" }]),
      ),
    );

    expect(calls.recalls).toHaveLength(1);
    expect(calls.recalls[0]?.query).toBe("What theme do I prefer?");
    expect(calls.recalls[0]?.topK).toBe(3);
    expect(calls.recalls[0]?.filter).toEqual({ agent: "assistant" });

    expect(result.messages).toBe(messages);
    expect(result.systemMessages).toHaveLength(2);
    expect(result.systemMessages[0]).toEqual({
      role: "system",
      content: "Be helpful",
    });
    expect(result.systemMessages[1]?.content).toContain(WOLBARG_MEMORY_CONTENT_MARKER);
    expect(result.systemMessages[1]?.content).toContain("User prefers dark mode");
  });

  it("injects as a prepended message when injection=message", async () => {
    const { memory } = createMockMemory({
      hits: [fakeHit("Prefers TypeScript")],
    });

    const processor = createWolbargProcessor({
      memory: memory as unknown as Wolbarg,
      agent: "assistant",
      injection: "message",
    });

    const messages = [fakeDbMessage("user", "What language?")];
    const result = asInputWithSystem(
      await processor.processInput!(fakeProcessInputArgs(messages)),
    );

    expect(result.messages).toHaveLength(2);
    expect(result.messages[0]?.role).toBe("system");
    expect(
      (result.messages[0]?.content.parts[0] as { text: string }).text,
    ).toContain("Prefers TypeScript");
    expect(result.messages[1]).toBe(messages[0]);
  });

  it("skips recall when recall=false", async () => {
    const { memory, calls } = createMockMemory({
      hits: [fakeHit("x")],
    });

    const processor = createWolbargProcessor({
      memory: memory as unknown as Wolbarg,
      agent: "assistant",
      recall: false,
    });

    const result = asInputWithSystem(
      await processor.processInput!(
        fakeProcessInputArgs([fakeDbMessage("user", "hi")]),
      ),
    );

    expect(calls.recalls).toHaveLength(0);
    expect(result.systemMessages).toEqual([]);
  });

  it("skips when there is no user message", async () => {
    const { memory, calls } = createMockMemory();
    const onTelemetry = vi.fn();

    const processor = createWolbargProcessor({
      memory: memory as unknown as Wolbarg,
      agent: "assistant",
      onTelemetry,
    });

    await processor.processInput!(
      fakeProcessInputArgs([fakeDbMessage("assistant", "hello")]),
    );

    expect(calls.recalls).toHaveLength(0);
    expect(onTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: "recall",
        skipped: true,
        reason: "no user message",
      }),
    );
  });

  it("uses configurable id", () => {
    const { memory } = createMockMemory();
    const processor = createWolbargProcessor({
      memory: memory as unknown as Wolbarg,
      agent: "assistant",
      id: "custom-wolbarg",
    });
    expect(processor.id).toBe("custom-wolbarg");
  });

  it("defaults id to wolbarg-memory", () => {
    const { memory } = createMockMemory();
    const processor = createWolbargProcessor({
      memory: memory as unknown as Wolbarg,
      agent: "assistant",
    });
    expect(processor.id).toBe("wolbarg-memory");
  });
});
