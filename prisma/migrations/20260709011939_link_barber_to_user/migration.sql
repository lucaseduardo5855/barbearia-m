/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Barber` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BarberRole" AS ENUM ('ADMIN', 'EMPLOYEE');

-- AlterTable
ALTER TABLE "Barber" ADD COLUMN     "role" "BarberRole" NOT NULL DEFAULT 'EMPLOYEE',
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Barber_userId_key" ON "Barber"("userId");

-- AddForeignKey
ALTER TABLE "Barber" ADD CONSTRAINT "Barber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
