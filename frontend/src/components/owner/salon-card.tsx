"use client";

import Link from "next/link";
import { MapPin, Pencil, Globe, GlobeLock, Scissors } from "lucide-react";
import { toast } from "sonner";

import { getApiError } from "@/lib/api";
import type { Salon } from "@/lib/api/salon.api";
import { usePublishSalon, useUnpublishSalon } from "@/hooks/use-salons";

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

  const isPending = publish.isPending || unpublish.isPending;

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
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
        <Button variant="outline" className="flex-1">
          <Link href={`/owner/salons/${salon.id}/edit`}>Edit</Link>
        </Button>

        {salon.status === "PUBLISHED" ? (
          <Button
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
