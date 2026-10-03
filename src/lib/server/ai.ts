import { getServerConfig } from "./env";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type AiProvider = { chat(messages: ChatMessage[]): Promise<string>; embed(text: string): Promise<number[]> };

export function createAiProvider(): AiProvider {
  const config = getServerConfig();
  const baseUrl = (config.aiBaseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const headers = { Authorization: `Bearer ${config.aiApiKey ?? ""}`, "Content-Type": "application/json" };
  return {
    async chat(messages) {
      const response = await fetch(`${baseUrl}/chat/completions`, { method: "POST", headers, body: JSON.stringify({ model: process.env.AI_CHAT_MODEL ?? "gpt-4o-mini", messages }) });
      if (!response.ok) throw new Error(`AI chat request failed (${response.status})`);
      const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      return json.choices?.[0]?.message?.content ?? "";
    },
    async embed(text) {
      const response = await fetch(`${baseUrl}/embeddings`, { method: "POST", headers, body: JSON.stringify({ model: process.env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small", input: text }) });
      if (!response.ok) throw new Error(`AI embedding request failed (${response.status})`);
      const json = await response.json() as { data?: Array<{ embedding: number[] }> };
      return json.data?.[0]?.embedding ?? [];
    },
  };
}
