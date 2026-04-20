-- AlterEnum
ALTER TYPE "MagicLinkPurpose" ADD VALUE 'BUYER_AUTH';

-- AlterTable
ALTER TABLE "Buyer" ADD COLUMN     "lastSignInAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "buyerEmail" TEXT,
ADD COLUMN     "shipToAddress1" TEXT,
ADD COLUMN     "shipToAddress2" TEXT,
ADD COLUMN     "shipToCity" TEXT,
ADD COLUMN     "shipToCountry" TEXT,
ADD COLUMN     "shipToName" TEXT,
ADD COLUMN     "shipToPostalCode" TEXT,
ADD COLUMN     "shipToState" TEXT;

-- Backfill legacy orders created before Sprint 7 introduced shipping snapshots.
UPDATE "Order" AS o
SET
  "buyerEmail" = COALESCE(b.email, 'legacy-' || o.id || '@example.invalid'),
  "shipToName" = COALESCE(NULLIF(b.name, ''), 'Legacy buyer'),
  "shipToAddress1" = 'Legacy order - address not captured',
  "shipToCity" = 'Unknown',
  "shipToState" = 'Unknown',
  "shipToPostalCode" = 'Unknown',
  "shipToCountry" = 'US'
FROM "Buyer" AS b
WHERE o."buyerId" = b.id;

UPDATE "Order"
SET
  "buyerEmail" = COALESCE("buyerEmail", 'legacy-' || id || '@example.invalid'),
  "shipToName" = COALESCE("shipToName", 'Legacy buyer'),
  "shipToAddress1" = COALESCE("shipToAddress1", 'Legacy order - address not captured'),
  "shipToCity" = COALESCE("shipToCity", 'Unknown'),
  "shipToState" = COALESCE("shipToState", 'Unknown'),
  "shipToPostalCode" = COALESCE("shipToPostalCode", 'Unknown'),
  "shipToCountry" = COALESCE("shipToCountry", 'US')
WHERE
  "buyerEmail" IS NULL
  OR "shipToName" IS NULL
  OR "shipToAddress1" IS NULL
  OR "shipToCity" IS NULL
  OR "shipToState" IS NULL
  OR "shipToPostalCode" IS NULL
  OR "shipToCountry" IS NULL;

ALTER TABLE "Order"
ALTER COLUMN "buyerEmail" SET NOT NULL,
ALTER COLUMN "shipToAddress1" SET NOT NULL,
ALTER COLUMN "shipToCity" SET NOT NULL,
ALTER COLUMN "shipToCountry" SET NOT NULL,
ALTER COLUMN "shipToName" SET NOT NULL,
ALTER COLUMN "shipToPostalCode" SET NOT NULL,
ALTER COLUMN "shipToState" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Order_buyerEmail_orderNumber_idx" ON "Order"("buyerEmail", "orderNumber");
