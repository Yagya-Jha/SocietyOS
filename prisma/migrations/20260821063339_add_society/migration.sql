/*
  Warnings:

  - Added the required column `society_id` to the `Incident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `society_id` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Society" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "invite_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Society_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Society_invite_code_key" ON "Society"("invite_code");

-- Insert Default Society
INSERT INTO "Society" ("id", "name", "invite_code") VALUES ('default-society-1', 'Default Society', 'DEFAULT123');

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN "society_id" TEXT;
UPDATE "Incident" SET "society_id" = 'default-society-1';
ALTER TABLE "Incident" ALTER COLUMN "society_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "society_id" TEXT;
UPDATE "User" SET "society_id" = 'default-society-1';
ALTER TABLE "User" ALTER COLUMN "society_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "Society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "Society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
