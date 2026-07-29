/*
  Warnings:

  - Added the required column `sellerContact` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerName` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_sellerId_fkey";

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "sellerContact" TEXT NOT NULL,
ADD COLUMN     "sellerName" TEXT NOT NULL,
ALTER COLUMN "sellerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
