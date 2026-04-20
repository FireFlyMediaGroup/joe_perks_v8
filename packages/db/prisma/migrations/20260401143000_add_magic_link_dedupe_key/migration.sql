-- AlterTable
ALTER TABLE "MagicLink" ADD COLUMN "dedupeKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_dedupeKey_key" ON "MagicLink"("dedupeKey");
