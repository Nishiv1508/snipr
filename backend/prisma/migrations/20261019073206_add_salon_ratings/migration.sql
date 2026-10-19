-- CreateTable
CREATE TABLE "salon_ratings" (
    "id" UUID NOT NULL,
    "salon_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salon_ratings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "salon_ratings"
ADD CONSTRAINT "salon_ratings_rating_check"
CHECK ("rating" >= 1 AND "rating" <= 5);

-- CreateIndex
CREATE INDEX "salon_ratings_salon_id_idx" ON "salon_ratings"("salon_id");

-- CreateIndex
CREATE INDEX "salon_ratings_customer_id_idx" ON "salon_ratings"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "salon_ratings_salon_id_customer_id_key" ON "salon_ratings"("salon_id", "customer_id");

-- AddForeignKey
ALTER TABLE "salon_ratings" ADD CONSTRAINT "salon_ratings_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "salons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salon_ratings" ADD CONSTRAINT "salon_ratings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
