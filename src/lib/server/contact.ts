import { db } from "./db";
import { getServerConfig } from "./env";

export async function createContactMessage(input: { name: string; email: string; message: string }) {
  const message = await db.contactMessage.create({ data: { name: input.name.trim(), email: input.email.trim().toLowerCase(), message: input.message.trim() } });
  const config = getServerConfig();
  if (config.telegramBotToken && config.telegramChatId) {
    const text = `New portfolio contact from ${message.name} (${message.email})\n\n${message.message}`;
    const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: config.telegramChatId, text }) });
    if (!response.ok) console.error("Telegram notification failed", response.status);
  }
  return message;
}
