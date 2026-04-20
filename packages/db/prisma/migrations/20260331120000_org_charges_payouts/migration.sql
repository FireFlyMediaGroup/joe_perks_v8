-- AlterTable
ALTER TABLE "Org" ADD COLUMN     "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false;
