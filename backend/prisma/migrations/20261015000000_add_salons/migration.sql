CREATE TABLE "salons" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "description" VARCHAR(1000),
    "address_line_1" VARCHAR(200) NOT NULL,
    "address_line_2" VARCHAR(200),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "postal_code" VARCHAR(12) NOT NULL,
    "country" VARCHAR(80) NOT NULL DEFAULT 'India',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "salons_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "salons"
ADD CONSTRAINT "salons_owner_id_fkey"
FOREIGN KEY ("owner_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "salons_owner_id_created_at_idx" ON "salons"("owner_id", "created_at");
CREATE INDEX "salons_city_state_idx" ON "salons"("city", "state");
