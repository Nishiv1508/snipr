"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Globe, GlobeLock, Scissors, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { getApiError } from "@/lib/api";
import type { Salon } from "@/lib/api/salon.api";
import {
  usePublishSalon,
  useUnpublishSalon,
  useUpdateSalonCapacity,
} from "@/hooks/use-salons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SalonCardProps {
  salon: Salon;
}

const statusStyles = {
  DRAFT:
    "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
  PUBLISHED:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
  UNPUBLISHED:
    "border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const statusLabels = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  UNPUBLISHED: "Unpublished",
};

export function SalonCard({ salon }: SalonCardProps) {
  const publish = usePublishSalon();
  const unpublish = useUnpublishSalon();
  const updateCapacity = useUpdateSalonCapacity();

  const [showCapacityForm, setShowCapacityForm] = useState(false);
  const [capacity, setCapacity] = useState(
    String(salon.defaultBookingCapacity ?? 1),
  );

  const isPending = publish.isPending || unpublish.isPending;
  const isCapacityPending = updateCapacity.isPending;

  async function handlePublish() {
    try {
      await publish.mutateAsync(salon.id);
      toast.success("Salon published successfully.");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  async function handleUnpublish() {
    try {
      await unpublish.mutateAsync(salon.id);
      toast.success("Salon unpublished successfully.");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  async function handleUpdateCapacity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedCapacity = Number(capacity);

    if (
      !Number.isInteger(parsedCapacity) ||
      parsedCapacity < 1 ||
      parsedCapacity > 500
    ) {
      toast.error("Capacity must be a whole number between 1 and 500.");
      return;
    }

    try {
      await updateCapacity.mutateAsync({
        salonId: salon.id,
        defaultBookingCapacity: parsedCapacity,
      });

      toast.success("Slot capacity updated successfully.");
      setShowCapacityForm(false);
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      {salon.imageUrl ? (
        <div className="aspect-16/7 overflow-hidden bg-muted">
          <img
            src={salon.imageUrl}
            alt={salon.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-16/7 items-center justify-center bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
          <Scissors className="size-10" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <Badge variant="outline" className={statusStyles[salon.status]}>
            {statusLabels[salon.status]}
          </Badge>

          <span className="text-xs text-muted-foreground">
            Updated {new Date(salon.updatedAt).toLocaleDateString()}
          </span>
        </div>

        <CardTitle className="line-clamp-1">{salon.name}</CardTitle>

        <CardDescription className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0" />
          <span>
            {salon.address}, {salon.city}, {salon.state}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
          {salon.description || "No salon description added yet."}
        </p>

        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Scissors className="size-4" />
          {salon.services?.length ?? 0} services
        </div>

        {/* Slot capacity editor */}
        <div className="mt-5 rounded-xl border bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Slot capacity</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {salon.defaultBookingCapacity ?? 1} bookings per slot
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowCapacityForm((current) => !current)}
            >
              <Settings2 className="mr-2 size-4" />
              {showCapacityForm ? "Close" : "Update"}
            </Button>
          </div>

          {showCapacityForm && (
            <form className="mt-4 space-y-3" onSubmit={handleUpdateCapacity}>
              <div className="space-y-2">
                <Label htmlFor={`capacity-${salon.id}`}>
                  Bookings per time slot
                </Label>

                <Input
                  id={`capacity-${salon.id}`}
                  type="number"
                  min={1}
                  max={500}
                  step={1}
                  required
                  value={capacity}
                  onChange={(event) => setCapacity(event.target.value)}
                  disabled={isCapacityPending}
                />

                <p className="text-xs text-muted-foreground">
                  Enter a whole number from 1 to 500.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="flex-1"
                  disabled={isCapacityPending}
                >
                  {isCapacityPending ? "Updating..." : "Save capacity"}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isCapacityPending}
                  onClick={() => {
                    setCapacity(String(salon.defaultBookingCapacity ?? 1));
                    setShowCapacityForm(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
        <Link
          href={`/owner/salons/${salon.id}/edit`}
          className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Edit
        </Link>

        {salon.status === "PUBLISHED" ? (
          <Button
            type="button"
            variant="secondary"
            onClick={handleUnpublish}
            disabled={isPending}
            className="flex-1"
          >
            <GlobeLock className="mr-2 size-4" />
            {unpublish.isPending ? "Updating..." : "Unpublish"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handlePublish}
            disabled={isPending}
            className="flex-1"
          >
            <Globe className="mr-2 size-4" />
            {publish.isPending ? "Publishing..." : "Publish"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
