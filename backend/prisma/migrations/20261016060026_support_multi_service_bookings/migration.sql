/*
  Warnings:

  - You are about to drop the column `service_duration_min` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `service_id` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `service_name` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `service_price` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `slot_id` on the `bookings` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_service_id_fkey";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_slot_id_fkey";

-- DropIndex
DROP INDEX "bookings_slot_id_status_idx";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "service_duration_min",
DROP COLUMN "service_id",
DROP COLUMN "service_name",
DROP COLUMN "service_price",
DROP COLUMN "slot_id";

-- CreateTable
CREATE TABLE "booking_items" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "slot_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "service_name" VARCHAR(120) NOT NULL,
    "service_price" DECIMAL(10,2) NOT NULL,
    "service_duration_min" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_items_slot_id_idx" ON "booking_items"("slot_id");

-- CreateIndex
CREATE INDEX "booking_items_service_id_idx" ON "booking_items"("service_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_items_booking_id_position_key" ON "booking_items"("booking_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "booking_items_slot_id_booking_id_key" ON "booking_items"("slot_id", "booking_id");

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "booking_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "salon_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
