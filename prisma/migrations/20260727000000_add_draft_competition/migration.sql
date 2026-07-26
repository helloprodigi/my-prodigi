-- CreateTable
CREATE TABLE IF NOT EXISTS "DraftCompetition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "tab" TEXT NOT NULL,
    "skills" TEXT[] NOT NULL DEFAULT '{}',
    "description" TEXT,
    "link" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DraftCompetition_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "DraftCompetition" ADD CONSTRAINT "DraftCompetition_createdById_fkey"
        FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DraftCompetition_tab_idx" ON "DraftCompetition"("tab");