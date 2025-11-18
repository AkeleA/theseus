/*
  Warnings:

  - The primary key for the `Url` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Url" DROP CONSTRAINT "Url_pkey",
ALTER COLUMN "code" SET DATA TYPE VARCHAR(64),
ADD CONSTRAINT "Url_pkey" PRIMARY KEY ("code");
