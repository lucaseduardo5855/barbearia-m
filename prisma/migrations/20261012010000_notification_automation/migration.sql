ALTER TABLE "Booking" ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "emailReminderConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "whatsappReminderConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "marketingConsent" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "CommunicationSettings" (
"barbershopId" TEXT NOT NULL PRIMARY KEY,
"emailReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
"whatsappReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
"reviewWhatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
"returnWhatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
"returnAfterDays" INTEGER NOT NULL DEFAULT 30,
CONSTRAINT "CommunicationSettings_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "NotificationDelivery" (
"id" TEXT NOT NULL PRIMARY KEY,
"dedupeKey" TEXT NOT NULL,
"barbershopId" TEXT NOT NULL,
"bookingId" TEXT NOT NULL,
"kind" TEXT NOT NULL,
"channel" TEXT NOT NULL,
"status" TEXT NOT NULL DEFAULT 'PROCESSING',
"providerId" TEXT,
"error" TEXT,
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"acceptedAt" TIMESTAMP(3),
CONSTRAINT "NotificationDelivery_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "NotificationDelivery_dedupeKey_key" ON "NotificationDelivery"("dedupeKey");
CREATE INDEX "NotificationDelivery_barbershopId_createdAt_idx" ON "NotificationDelivery"("barbershopId", "createdAt");
