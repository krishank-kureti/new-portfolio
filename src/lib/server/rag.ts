import { db } from "./db";
import { createAiProvider } from "./ai";

const vectorLiteral = (values: number[]) => `[${values.join(",")}]`;

export async function storeChunk(projectId: string, fileId: string, content: string, ordinal: number): Promise<void> {
  const embedding = await createAiProvider().embed(content);
  await db.$executeRawUnsafe(`INSERT INTO "Chunk" ("id", "projectId", "fileId", "content", "ordinal", "embedding", "createdAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::vector, NOW())`, projectId, fileId, content, ordinal, vectorLiteral(embedding));
}

export async function searchProject(projectId: string, query: string, limit = 8) {
  const embedding = await createAiProvider().embed(query);
  const result = await db.$queryRawUnsafe(`SELECT "id", "content", 1 - ("embedding" <=> $1::vector) AS distance FROM "Chunk" WHERE "projectId" = $2 ORDER BY "embedding" <=> $1::vector LIMIT $3`, vectorLiteral(embedding), projectId, limit);
  return result as Array<{ id: string; content: string; distance: number }>;
}
