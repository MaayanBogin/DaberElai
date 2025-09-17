/*
  Warnings:

  - A unique constraint covering the columns `[polarCustomerId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "polarCustomerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_polarCustomerId_key" ON "public"."users"("polarCustomerId");
