/** Server-only configuration. Never import this module from client components. */
export type ServerConfig = {
  databaseUrl: string;
  githubClientId: string;
  githubClientSecret: string;
  githubToken?: string;
  adminGithubLogins: string[];
  sessionSecret: string;
  aiProvider: string;
  aiApiKey?: string;
  aiBaseUrl?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
};

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
};

export function getServerConfig(): ServerConfig {
  return {
    databaseUrl: required("DATABASE_URL"),
    githubClientId: required("GITHUB_CLIENT_ID"),
    githubClientSecret: required("GITHUB_CLIENT_SECRET"),
    githubToken: process.env.GITHUB_TOKEN,
    adminGithubLogins: (process.env.ADMIN_GITHUB_LOGINS ?? "")
      .split(",").map((login) => login.trim().toLowerCase()).filter(Boolean),
    sessionSecret: required("SESSION_SECRET"),
    aiProvider: process.env.AI_PROVIDER ?? "openai-compatible",
    aiApiKey: process.env.AI_API_KEY,
    aiBaseUrl: process.env.AI_BASE_URL,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
  };
}
