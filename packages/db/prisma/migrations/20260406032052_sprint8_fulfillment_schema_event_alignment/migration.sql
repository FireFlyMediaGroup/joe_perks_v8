-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderEventType" ADD VALUE 'ORDER_FLAGGED';
ALTER TYPE "OrderEventType" ADD VALUE 'FLAG_RESOLVED';
ALTER TYPE "OrderEventType" ADD VALUE 'MAGIC_LINK_RESENT';
ALTER TYPE "OrderEventType" ADD VALUE 'TRACKING_UPDATED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "adminAcknowledgedFlag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "flagNote" TEXT,
ADD COLUMN     "flagReason" TEXT,
ADD COLUMN     "flagResolvedAt" TIMESTAMP(3),
ADD COLUMN     "flaggedAt" TIMESTAMP(3),
ADD COLUMN     "fulfillmentNote" TEXT,
ADD COLUMN     "resolutionOffered" TEXT;
