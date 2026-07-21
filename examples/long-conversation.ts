/**
 * Long conversation — Wolbarg keeps semantic facts across many turns.
 * Requires OPENAI_API_KEY. Illustrative — not run in CI.
 */

import { Agent } from "@mastra/core/agent";
import { wolbarg, sqlite, openaiEmbedding } from "wolbarg";
import { createWolbargProcessor } from "../src/index.js";

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Set OPENAI_API_KEY");

  const memory = wolbarg({
    organization: "mastra-long",
    storage: sqlite("./examples-long.db"),
    embedding: openaiEmbedding({ apiKey, model: "text-embedding-3-small" }),
  });
  await memory.ready();

  const processor = createWolbargProcessor({
    memory,
    agent: "assistant",
    sessionId: "long-1",
    topK: 5,
  });

  const agent = new Agent({
    id: "assistant",
    name: "Assistant",
    instructions: "Track user facts briefly.",
    model: "openai/gpt-4.1-mini",
    inputProcessors: [processor],
    outputProcessors: [processor],
  });

  for (let i = 0; i < 8; i++) {
    await agent.generate(`Fact ${i}: project codename is Orion-${i}.`);
  }

  const result = await agent.generate("What project codenames have I mentioned?");
  console.log(result.text);
  await memory.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
