-- 1. Add nullable columns for actual service start and end times
ALTER TABLE "booking_items"
ADD COLUMN "ends_at" TIMESTAMP(3);

ALTER TABLE "booking_items"
ADD COLUMN "starts_at" TIMESTAMP(3);

-- 2. Backfill existing items using their slot start and service duration
UPDATE "booking_items" AS bi
SET
  "starts_at" = s."starts_at",
  "ends_at" = s."starts_at"
    + (bi."service_duration_min" * INTERVAL '1 minute')
FROM "booking_slots" AS s
WHERE bi."slot_id" = s."id";

-- 3. Require timestamps after backfilling existing records
ALTER TABLE "booking_items"
ALTER COLUMN "ends_at" SET NOT NULL;

ALTER TABLE "booking_items"
ALTER COLUMN "starts_at" SET NOT NULL;

-- 4. Drop the old unique index
DROP INDEX IF EXISTS "booking_items_slot_id_booking_id_key";

-- 5. Create the booking-to-slot reservation table
CREATE TABLE "booking_slot_reservations" (
  "booking_id" UUID NOT NULL,
  "slot_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "booking_slot_reservations_pkey"
    PRIMARY KEY ("booking_id", "slot_id")
);

-- 6. Backfill reservations, one per booking and slot
INSERT INTO "booking_slot_reservations" ("booking_id", "slot_id")
SELECT DISTINCT "booking_id", "slot_id"
FROM "booking_items";

-- 7. Create indexes
CREATE INDEX "booking_slot_reservations_slot_id_idx"
ON "booking_slot_reservations" ("slot_id");

-- 8. Add foreign keys
ALTER TABLE "booking_slot_reservations"
ADD CONSTRAINT "booking_slot_reservations_booking_id_fkey"
FOREIGN KEY ("booking_id")
REFERENCES "bookings" ("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "booking_slot_reservations"
ADD CONSTRAINT "booking_slot_reservations_slot_id_fkey"
FOREIGN KEY ("slot_id")
REFERENCES "booking_slots" ("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;