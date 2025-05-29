/*
  Warnings:

  - You are about to drop the column `culqiChargeId` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "culqiChargeId",
ADD COLUMN     "externalChargeId" TEXT;
