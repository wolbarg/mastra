/**
 * Two Mastra agents sharing one Wolbarg store.
 * Requires OPENAI_API_KEY. Illustrative — not run in CI.
 */

import { Agent } from "@mastra/core/agent";
import { wolbarg, sqlite, openaiEmbedding } from "wolbarg";
import { createWolbargProcessor } from "../src/index.js";

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Set OPENAI_API_KEY");

  const memory = wolbarg({
    organization: "mastra-multi",
    storage: sqlite("./examples-multi.db"),
    embedding: openaiEmbedding({ apiKey, model: "text-embedding-3-small" }),
  });
  await memory.ready();

  const researchProc = createWolbargProcessor({
    memory,
    agent: "researcher",
  });
  const writerProc = createWolbargProcessor({ memory, agent: "writer" });

  const researcher = new Agent({
    id: "researcher",
    name: "Researcher",
    instructions: "Capture factual notes.",
    model: "openai/gpt-4.1-mini",
    inputProcessors: [researchProc],
    outputProcessors: [researchProc],
  });

  const writer = new Agent({
    id: "writer",
    name: "Writer",
    instructions: "Write briefly using known facts.",
    model: "openai/gpt-4.1-mini",
    inputProcessors: [writerProc],
    outputProcessors: [writerProc],
  });

  await researcher.generate("Note: launch date is March 12.");
  // Seed shared fact for writer agent id
  await memory.remember({
    agent: "writer",
    content: { text: "Launch date is March 12." },
  });
  const out = await writer.generate("When is launch?");
  console.log(out.text);
  await memory.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
