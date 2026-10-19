"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Scissors } from "lucide-react";

import type { PublicSalon } from "@/lib/api/salon.api";
import { Card, CardContent } from "@/components/ui/card";
import StarRating from "@/components/customers/StarRating";

interface SalonCardProps {
  salon: PublicSalon;
}

export default function SalonCard({ salon }: SalonCardProps) {
  const activeServices = (salon.services ?? []).filter(
    (service) => service.isActive,
  );

  return (
    <Link
      href={`/customer/salons/${salon.id}`}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="h-full overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">
        {salon.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={salon.imageUrl}
            alt={salon.name}
            className="h-48 w-full bg-muted object-cover"
          />
        ) : (
          <div className="flex h-48 items-center justify-center bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
            <Scissors className="size-12" />
          </div>
        )}

        <CardContent className="p-5">
          <h2 className="line-clamp-1 text-xl font-semibold tracking-tight">
            {salon.name}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <StarRating
              value={
                salon.averageRating == null
                  ? 0
                  : Math.round(salon.averageRating)
              }
              size="sm"
              label={
                salon.averageRating == null
                  ? "No customer ratings yet"
                  : `${salon.averageRating.toFixed(1)} out of 5 stars`
              }
            />
            {salon.ratingCount > 0 ? (
              <span className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {salon.averageRating?.toFixed(1)}
                </span>{" "}
                ({salon.ratingCount} rating{salon.ratingCount === 1 ? "" : "s"})
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                No ratings yet
              </span>
            )}
          </div>

          <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span>
              {salon.address}, {salon.city}, {salon.state}
              {salon.postalCode ? ` - ${salon.postalCode}` : ""}
            </span>
          </p>

          <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground">
            {salon.description || "Discover services offered by this salon."}
          </p>

          <div className="mt-5 flex items-center justify-between border-t pt-4">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Scissors className="size-4" />
              {activeServices.length} services
            </span>

            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              View salon
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
