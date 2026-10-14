-- Localização estruturada para filtros por estado e cidade.
ALTER TABLE "Barbershop" ADD COLUMN "city" TEXT;
ALTER TABLE "Barbershop" ADD COLUMN "state" TEXT;
