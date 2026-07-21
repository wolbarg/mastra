import { describe, expect, it, vi } from "vitest";
import type { Wolbarg } from "wolbarg";
import { createWolbargProcessor, wolbargProcessor } from "../src/index.js";
import {
  createMockMemory,
  fakeDbMessage,
  fakeProcessOutputArgs,
} from "./helpers/mock-memory.js";

describe("createWolbargProcessor processOutputResult", () => {
  it("remembers user+assistant text via rememberFromMessages", async () => {
    const { memory, calls } = createMockMemory();

    const processor = createWolbargProcessor({
      memory: memory as unknown as Wolbarg,
      agent: "assistant",
      sessionId: "s1",
      userId: "u1",
      tags: ["demo"],
      namespace: "ns",
      metadata: { custom: true },
    });

    const messages = [
      fakeDbMessage("user", "I like dark mode"),
      fakeDbMessage("assistant", "Got it"),
    ];

    const result = await processor.processOutputResult!(
      fakeProcessOutputArgs(messages),
    );

    expect(result).toBe(messages);
    expect(calls.remembers).toHaveLength(1);
    expect(calls.remembers[0]?.messages).toEqual([
      { role: "user", content: "I like dark mode" },
      { role: "assistant", content: "Got it" },
    ]);
    expect(calls.remembers[0]?.options).toMatchObject({
      agent: "assistant",
      mode: "raw",
      rawStrategy: "last_user",
      metadata: {
        custom: true,
        sessionId: "s1",
        userId: "u1",
        tags: ["demo"],
        namespace: "ns",
        source: "wolbarg-mastra",
      },
    });
  });

  it("skips remember when remember=false", async () => {
    const { memory, calls } = createMockMemory();
    const processor = createWolbargProcessor({
      memory: memory as unknown as Wolbarg,
      agent: "assistant",
      remember: false,
    });

    await processor.processOutputResult!(
      fakeProcessOutputArgs([
        fakeDbMessage("user", "hi"),
        fakeDbMessage("assistant", "yo"),
      ]),
    );

    expect(calls.remembers).toHaveLength(0);
  });

  it("returns messages unchanged when there is no user text", async () => {
    const { memory, calls } = createMockMemory();
    const onTelemetry = vi.fn();
    const processor = createWolbargProcessor({
      memory: memory as unknown as Wolbarg,
      agent: "assistant",
      onTelemetry,
    });

    const messages = [fakeDbMessage("assistant", "only assistant")];
    const result = await processor.processOutputResult!(
      fakeProcessOutputArgs(messages),
    );

    expect(result).toBe(messages);
    expect(calls.remembers).toHaveLength(0);
    expect(onTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: "remember",
        skipped: true,
        reason: "no user messages",
      }),
    );
  });

  it("wolbargProcessor is an alias of createWolbargProcessor", () => {
    expect(wolbargProcessor).toBe(createWolbargProcessor);
  });
});
