/**
 * Multi-turn chatbot with shared Wolbarg semantic memory.
 * Requires OPENAI_API_KEY. Illustrative — not run in CI.
 */

import { Agent } from "@mastra/core/agent";
import { wolbarg, sqlite, openaiEmbedding } from "wolbarg";
import { createWolbargProcessor } from "../src/index.js";

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Set OPENAI_API_KEY");

  const memory = wolbarg({
    organization: "mastra-chatbot",
    storage: sqlite("./examples-chatbot.db"),
    embedding: openaiEmbedding({ apiKey, model: "text-embedding-3-small" }),
  });
  await memory.ready();

  const processor = createWolbargProcessor({
    memory,
    agent: "chatbot",
    sessionId: "user-1",
  });

  const agent = new Agent({
    id: "chatbot",
    name: "Chatbot",
    instructions: "Remember user preferences when stated.",
    model: "openai/gpt-4.1-mini",
    inputProcessors: [processor],
    outputProcessors: [processor],
  });

  await agent.generate("I prefer dark mode.");
  const followUp = await agent.generate("What UI theme do I prefer?");
  console.log(followUp.text);
  await memory.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
