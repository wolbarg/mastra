import { describe, expect, it, vi } from "vitest";
import type { Wolbarg } from "wolbarg";
import { createWolbargProcessor } from "../src/index.js";
import {
  createMockMemory,
  fakeDbMessage,
  fakeProcessInputArgs,
  fakeProcessOutputArgs,
} from "./helpers/mock-memory.js";

describe("createWolbargProcessor resilience", () => {
  it("soft-fails when recall throws", async () => {
    const onError = vi.fn();
    const { memory, calls } = createMockMemory({
      recallError: new Error("recall down"),
    });

    const processor = createWolbargProcessor({
      memory: memory as unknown as Wolbarg,
      agent: "assistant",
      onError,
    });

    const messages = [fakeDbMessage("user", "hi")];
    const systemMessages = [{ role: "system" as const, content: "sys" }];

    const result = await processor.processInput!(
      fakeProcessInputArgs(messages, systemMessages),
    );

    expect(onError).toHaveBeenCalledWith(expect.any(Error), "recall");
    expect(result).toEqual({ messages, systemMessages });
    expect(calls.recalls).toHaveLength(1);
  });

  it("returns messages when remember throws", async () => {
    const onError = vi.fn();
    const { memory } = createMockMemory({
      rememberError: new Error("remember down"),
    });

    const processor = createWolbargProcessor({
      memory: memory as unknown as Wolbarg,
      agent: "assistant",
      onError,
    });

    const messages = [
      fakeDbMessage("user", "hi"),
      fakeDbMessage("assistant", "yo"),
    ];

    const result = await processor.processOutputResult!(
      fakeProcessOutputArgs(messages),
    );

    expect(result).toBe(messages);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), "remember");
  });

  it("never throws when onError itself throws", async () => {
    const { memory } = createMockMemory({
      recallError: new Error("recall"),
    });

    const processor = createWolbargProcessor({
      memory: memory as unknown as Wolbarg,
      agent: "assistant",
      onError: () => {
        throw new Error("hook boom");
      },
    });

    const messages = [fakeDbMessage("user", "hi")];
    const result = await processor.processInput!(
      fakeProcessInputArgs(messages),
    );

    expect(result).toEqual({ messages, systemMessages: [] });
  });

  it("throws at construction when memory is missing", () => {
    expect(() =>
      createWolbargProcessor({
        memory: undefined as never,
        agent: "assistant",
      }),
    ).toThrow(/memory is required/);
  });

  it("throws at construction when agent is empty", () => {
    const { memory } = createMockMemory();
    expect(() =>
      createWolbargProcessor({
        memory: memory as unknown as Wolbarg,
        agent: "  ",
      }),
    ).toThrow(/agent must be a non-empty string/);
  });
});
