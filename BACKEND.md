# Backend scaffold

This project keeps server-only integrations under `src/lib/server/`.

1. Copy `.env.example` to `.env.local` and replace every required placeholder.
2. Install the runtime packages in the Next.js app: `@prisma/client`, `prisma`, and an AI-compatible fetch client if desired.
3. Run `npx prisma generate`, then `npx prisma migrate dev --name init` (or `npx prisma migrate deploy` in Vercel/production).
4. Use `createAiProvider`, `ingestRepository`, `searchProject`, and `createContactMessage` from server routes/actions only.

`Chunk.embedding` is written/read with parameterized raw SQL because Prisma does not expose pgvector values as a first-class scalar. Keep `AI_EMBEDDING_MODEL` at 1536 dimensions or change the schema and migration together.
