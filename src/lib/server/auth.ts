import { createHmac, timingSafeEqual } from "node:crypto";
import { getServerConfig } from "./env";

export const githubAuthorizeUrl = (state: string, redirectUri: string) => {
  const params = new URLSearchParams({ client_id: getServerConfig().githubClientId, redirect_uri: redirectUri, scope: "read:user user:email", state });
  return `https://github.com/login/oauth/authorize?${params}`;
};

export async function exchangeGithubCode(code: string, redirectUri: string) {
  const config = getServerConfig();
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: config.githubClientId, client_secret: config.githubClientSecret, code, redirect_uri: redirectUri }),
  });
  if (!response.ok) throw new Error(`GitHub token exchange failed (${response.status})`);
  return response.json() as Promise<{ access_token?: string; error?: string }>;
}

export async function getGithubUser(token: string): Promise<{ id: number; login: string; avatar_url?: string; email?: string }> {
  const response = await fetch("https://api.github.com/user", { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`GitHub user lookup failed (${response.status})`);
  return response.json();
}

export function isAdminGithubLogin(login: string): boolean {
  return getServerConfig().adminGithubLogins.includes(login.toLowerCase());
}

export function signSession(payload: { userId: string; expiresAt: number }): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getServerConfig().sessionSecret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifySession(value: string): { userId: string; expiresAt: number } | null {
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", getServerConfig().sessionSecret).update(body).digest();
  const actual = Buffer.from(signature, "base64url");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const session = JSON.parse(Buffer.from(body, "base64url").toString()) as { userId: string; expiresAt: number };
    return session.expiresAt > Date.now() ? session : null;
  } catch { return null; }
}
