/**
 * Minimal Mastra agent + Wolbarg processor.
 * Requires OPENAI_API_KEY. Illustrative — not run in CI.
 */

import { Agent } from "@mastra/core/agent";
import { wolbarg, sqlite, openaiEmbedding } from "wolbarg";
import { createWolbargProcessor } from "../src/index.js";

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Set OPENAI_API_KEY");

  const memory = wolbarg({
    organization: "mastra-minimal",
    storage: sqlite("./examples-minimal.db"),
    embedding: openaiEmbedding({ apiKey, model: "text-embedding-3-small" }),
  });
  await memory.ready();

  const processor = createWolbargProcessor({
    memory,
    agent: "assistant",
  });

  const agent = new Agent({
    id: "assistant",
    name: "Assistant",
    instructions: "Reply in one short sentence.",
    model: "openai/gpt-4.1-mini",
    inputProcessors: [processor],
    outputProcessors: [processor],
  });

  const result = await agent.generate("Say hello.");
  console.log(result.text);
  await memory.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
