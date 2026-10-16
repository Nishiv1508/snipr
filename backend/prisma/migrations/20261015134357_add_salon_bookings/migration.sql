-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- AlterTable
ALTER TABLE "salons" ADD COLUMN     "default_booking_capacity" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata';

-- CreateTable
CREATE TABLE "booking_slots" (
    "id" UUID NOT NULL,
    "salon_id" UUID NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 50,
    "booked_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(30) NOT NULL,
    "customer_id" UUID NOT NULL,
    "slot_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "service_name" VARCHAR(120) NOT NULL,
    "service_price" DECIMAL(10,2) NOT NULL,
    "service_duration_min" INTEGER NOT NULL,
    "ticket_key_hash" TEXT NOT NULL,
    "ticket_key_enc" TEXT NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_slots_salon_id_starts_at_idx" ON "booking_slots"("salon_id", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "booking_slots_salon_id_starts_at_key" ON "booking_slots"("salon_id", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_reference_key" ON "bookings"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_ticket_key_hash_key" ON "bookings"("ticket_key_hash");

-- CreateIndex
CREATE INDEX "bookings_customer_id_status_created_at_idx" ON "bookings"("customer_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "bookings_slot_id_status_idx" ON "bookings"("slot_id", "status");

-- AddForeignKey
ALTER TABLE "booking_slots" ADD CONSTRAINT "booking_slots_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "salons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "booking_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "salon_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
