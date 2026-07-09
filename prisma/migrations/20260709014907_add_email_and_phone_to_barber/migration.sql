/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Barber` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `Barber` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Barber" ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Barber_email_key" ON "Barber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Barber_phone_key" ON "Barber"("phone");
