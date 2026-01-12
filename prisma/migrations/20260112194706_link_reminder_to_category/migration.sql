/*
  Warnings:

  - You are about to drop the column `category` on the `Reminder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reminder" DROP COLUMN "category",
ADD COLUMN     "categoryId" TEXT;

-- CreateIndex
CREATE INDEX "Reminder_categoryId_idx" ON "Reminder"("categoryId");

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
