/**
 * Persistence across restarts via Wolbarg SQLite + Mastra processor.
 * Requires OPENAI_API_KEY. Illustrative — not run in CI.
 */

import { Agent } from "@mastra/core/agent";
import { wolbarg, sqlite, openaiEmbedding } from "wolbarg";
import { createWolbargProcessor } from "../src/index.js";

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Set OPENAI_API_KEY");
  const db = "./examples-persist.db";

  {
    const memory = wolbarg({
      organization: "mastra-persist",
      storage: sqlite(db),
      embedding: openaiEmbedding({ apiKey, model: "text-embedding-3-small" }),
    });
    await memory.ready();
    const processor = createWolbargProcessor({
      memory,
      agent: "assistant",
      sessionId: "s1",
    });
    const agent = new Agent({
      id: "assistant",
      name: "Assistant",
      instructions: "Be concise.",
      model: "openai/gpt-4.1-mini",
      inputProcessors: [processor],
      outputProcessors: [processor],
    });
    await agent.generate("Remember: deploy window is Friday night.");
    await memory.close();
  }

  {
    const memory = wolbarg({
      organization: "mastra-persist",
      storage: sqlite(db),
      embedding: openaiEmbedding({ apiKey, model: "text-embedding-3-small" }),
    });
    await memory.ready();
    const processor = createWolbargProcessor({
      memory,
      agent: "assistant",
      sessionId: "s1",
    });
    const agent = new Agent({
      id: "assistant",
      name: "Assistant",
      instructions: "Be concise.",
      model: "openai/gpt-4.1-mini",
      inputProcessors: [processor],
      outputProcessors: [processor],
    });
    const result = await agent.generate("When is the deploy window?");
    console.log(result.text);
    await memory.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
