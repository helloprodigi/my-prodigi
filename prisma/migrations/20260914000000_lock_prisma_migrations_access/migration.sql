-- The Prisma bookkeeping table is not application data and must not be exposed through PostgREST.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "_prisma_migrations" FROM anon, authenticated;
