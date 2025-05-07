/*
  Warnings:

  - You are about to drop the column `description` on the `TranslationProject` table. All the data in the column will be lost.
  - You are about to drop the column `translations` on the `TranslationProject` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TranslationProject" DROP COLUMN "description",
DROP COLUMN "translations";

-- CreateTable
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "json" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Translation_projectId_language_key" ON "Translation"("projectId", "language");

-- AddForeignKey
ALTER TABLE "Translation" ADD CONSTRAINT "Translation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TranslationProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
