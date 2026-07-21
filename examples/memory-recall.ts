/**
 * Explicit seed + recall via processor.
 * Requires OPENAI_API_KEY. Illustrative — not run in CI.
 */

import { Agent } from "@mastra/core/agent";
import { wolbarg, sqlite, openaiEmbedding } from "wolbarg";
import { createWolbargProcessor } from "../src/index.js";

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Set OPENAI_API_KEY");

  const memory = wolbarg({
    organization: "mastra-recall",
    storage: sqlite("./examples-recall.db"),
    embedding: openaiEmbedding({ apiKey, model: "text-embedding-3-small" }),
  });
  await memory.ready();

  await memory.remember({
    agent: "assistant",
    content: { text: "Billing contact is finance@example.com." },
  });

  const processor = createWolbargProcessor({
    memory,
    agent: "assistant",
    topK: 3,
  });

  const agent = new Agent({
    id: "assistant",
    name: "Assistant",
    instructions: "Use recalled memories when helpful.",
    model: "openai/gpt-4.1-mini",
    inputProcessors: [processor],
    outputProcessors: [processor],
  });

  const result = await agent.generate("Who is the billing contact?");
  console.log(result.text);
  await memory.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
