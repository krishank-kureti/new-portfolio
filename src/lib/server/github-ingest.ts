import { getServerConfig } from "./env";

export type RepositoryFile = { path: string; sha: string; content: string };
const headers = () => ({ Accept: "application/vnd.github+json", ...(getServerConfig().githubToken ? { Authorization: `Bearer ${getServerConfig().githubToken}` } : {}) });

export async function ingestRepository(owner: string, repo: string, ref = "HEAD"): Promise<RepositoryFile[]> {
  const treeResponse = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(ref)}?recursive=1`, { headers: headers() });
  if (!treeResponse.ok) throw new Error(`GitHub tree request failed (${treeResponse.status})`);
  const tree = await treeResponse.json() as { tree?: Array<{ path: string; sha: string; type: string; size?: number }>; truncated?: boolean };
  if (tree.truncated) throw new Error("Repository tree is too large; ingest a narrower ref or path.");
  const files = (tree.tree ?? []).filter((entry) => entry.type === "blob" && (entry.size ?? 0) <= 1_000_000 && !/\b(node_modules|\.git|dist|build)\b/.test(entry.path));
  return Promise.all(files.map(async (file) => {
    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${file.path}?ref=${encodeURIComponent(ref)}`, { headers: headers() });
    if (!response.ok) throw new Error(`GitHub file request failed for ${file.path} (${response.status})`);
    const json = await response.json() as { content?: string; encoding?: string };
    return { path: file.path, sha: file.sha, content: json.encoding === "base64" ? Buffer.from((json.content ?? "").replace(/\n/g, ""), "base64").toString("utf8") : (json.content ?? "") };
  }));
}
