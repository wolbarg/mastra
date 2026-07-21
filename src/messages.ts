/**
 * Extract / convert MastraDBMessage text for Wolbarg recall & remember.
 */

import type { ProcessInputArgs } from "@mastra/core/processors";
import type { ConversationMessage } from "wolbarg";
import { isInjectedMemoryText } from "./markers.js";

/** Same shape as Mastra's MastraDBMessage (from ProcessInputArgs). */
export type MastraDBMessage = ProcessInputArgs["messages"][number];

type TextPart = { type: "text"; text: string };

function isTextPart(part: unknown): part is TextPart {
  return (
    !!part &&
    typeof part === "object" &&
    (part as { type?: unknown }).type === "text" &&
    typeof (part as { text?: unknown }).text === "string"
  );
}

/** Join all `type: "text"` parts from a MastraDBMessage. */
export function getMessageText(message: MastraDBMessage): string {
  const parts = message.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    // Fallback: legacy `content.content` string if present
    const legacy = message.content?.content;
    return typeof legacy === "string" ? legacy : "";
  }
  return parts
    .filter(isTextPart)
    .map((p) => p.text)
    .join("");
}

/** Last user-turn text (from message parts), or empty string. */
export function getLastUserText(messages: MastraDBMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg?.role === "user") {
      return getMessageText(msg);
    }
  }
  return "";
}

/**
 * Map MastraDBMessage[] → Wolbarg ConversationMessage[] (user + assistant only).
 * Skips empty text and Wolbarg-injected memory markers.
 */
export function toConversationMessages(
  messages: MastraDBMessage[],
): ConversationMessage[] {
  const out: ConversationMessage[] = [];
  for (const msg of messages) {
    if (msg.role !== "user" && msg.role !== "assistant") continue;
    const content = getMessageText(msg).trim();
    if (!content || isInjectedMemoryText(content)) continue;
    out.push({ role: msg.role, content });
  }
  return out;
}

/** Build a system-role MastraDBMessage carrying injected memory context. */
export function createMemoryDbMessage(text: string): MastraDBMessage {
  return {
    id: `wolbarg-memory-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: "system",
    createdAt: new Date(),
    content: {
      format: 2,
      parts: [{ type: "text", text }],
      metadata: { wolbarg: { injectedMemory: true } },
    },
  };
}
