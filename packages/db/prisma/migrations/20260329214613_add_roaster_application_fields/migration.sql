/*
  Warnings:

  - Added the required column `city` to the `RoasterApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactName` to the `RoasterApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `RoasterApplication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RoasterApplication" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "coffeeInfo" TEXT,
ADD COLUMN     "contactName" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "website" TEXT;
