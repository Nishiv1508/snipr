"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  Scissors,
  Store,
} from "lucide-react";

import { usePublicSalon } from "@/hooks/use-salons";
import { getApiError } from "@/lib/api";
import type { WeekDay } from "@/lib/api/salon.api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Footer } from "@/components/footer";

const DAYS: { day: WeekDay; label: string }[] = [
  { day: "MONDAY", label: "Monday" },
  { day: "TUESDAY", label: "Tuesday" },
  { day: "WEDNESDAY", label: "Wednesday" },
  { day: "THURSDAY", label: "Thursday" },
  { day: "FRIDAY", label: "Friday" },
  { day: "SATURDAY", label: "Saturday" },
  { day: "SUNDAY", label: "Sunday" },
];

function formatTime(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;

  return `${formattedHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

export default function CustomerSalonDetailPage() {
  const params = useParams<{ id: string }>();
  const salonQuery = usePublicSalon(params.id);

  if (salonQuery.isPending) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8 sm:py-12">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-24 w-2/3" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </main>
    );
  }

  if (salonQuery.isError || !salonQuery.data) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
          <Link
            href="/customer/salons"
            className="mb-6 inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:h-11 sm:px-4"
          >
            <ArrowLeft className="size-4 shrink-0" />
            <span>Back to dashboard</span>
          </Link>

          <Alert variant="destructive">
            <AlertDescription>
              {salonQuery.isError
                ? getApiError(salonQuery.error)
                : "Salon not found."}
            </AlertDescription>
          </Alert>

          <Button
            variant="outline"
            className="mt-4"
            onClick={() => salonQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      </main>
    );
  }

  const salon = salonQuery.data;
  const services = (salon.services ?? []).filter((service) => service.isActive);

  const hoursByDay = new Map(
    (salon.hours ?? []).map((item) => [item.day, item]),
  );

  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          href="./"
          className="mb-6 inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:h-11 sm:px-4"
        >
          <ArrowLeft className="size-4 shrink-0" />
          <span>Back to dashboard</span>
        </Link>

        {/* Salon banner */}
        <Card className="overflow-hidden">
          {salon.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={salon.imageUrl}
              alt={salon.name}
              className="h-56 w-full bg-muted object-cover sm:h-80"
            />
          ) : (
            <div className="flex h-56 items-center justify-center bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300 sm:h-80">
              <Scissors className="size-16" />
            </div>
          )}

          <CardContent className="p-6 sm:p-8">
            <Badge variant="secondary" className="mb-3">
              Salon
            </Badge>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {salon.name}
            </h1>

            <p className="mt-3 max-w-3xl text-muted-foreground">
              {salon.description ||
                "Explore the services available at this salon."}
            </p>

            <div className="mt-5 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-5">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  {salon.address}, {salon.city}, {salon.state}
                  {salon.postalCode ? ` - ${salon.postalCode}` : ""}
                </span>
              </p>

              {salon.phone && (
                <a
                  href={`tel:${salon.phone}`}
                  className="flex items-center gap-2 transition-colors hover:text-primary"
                >
                  <Phone className="size-4" />
                  {salon.phone}
                </a>
              )}
            </div>

            {salon.googleMapsUrl && (
              <Button variant="outline" className="mt-5">
                <a
                  href={salon.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get directions
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Services and opening hours */}
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="size-5" />
                Services
              </CardTitle>
              <CardDescription>
                {services.length} available service
                {services.length === 1 ? "" : "s"} at this salon
              </CardDescription>
            </CardHeader>

            <CardContent>
              {services.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">
                  No services are currently available.
                </p>
              ) : (
                <div className="divide-y">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <h3 className="font-medium">{service.name}</h3>

                        {service.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {service.description}
                          </p>
                        )}

                        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="size-3.5" />
                          {service.durationMin} minutes
                        </p>
                      </div>

                      <p className="shrink-0 text-lg font-semibold tabular-nums">
                        ₹{Number(service.price).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5" />
                Opening hours
              </CardTitle>
              <CardDescription>
                Weekly business hours for {salon.name}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="divide-y">
                {DAYS.map(({ day, label }) => {
                  const item = hoursByDay.get(day);

                  const isClosed = !item || item.isClosed;

                  return (
                    <div
                      key={day}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="font-medium">{label}</span>

                      {isClosed ? (
                        <span className="text-sm font-medium text-muted-foreground">
                          Closed
                        </span>
                      ) : item?.opensAt && item?.closesAt ? (
                        <span className="text-right text-sm tabular-nums">
                          {formatTime(item.opensAt)} –{" "}
                          {formatTime(item.closesAt)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Hours unavailable
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex items-center gap-3 rounded-xl border bg-card p-5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
            <Store className="size-5" />
          </div>

          <div>
            <h2 className="font-medium">Discover your next look</h2>
            <p className="text-sm text-muted-foreground">
              Explore other salons and compare their services.
            </p>
          </div>

          <Button variant="outline" className="ml-auto shrink-0">
            <Link href="/customer/salons">Browse</Link>
          </Button>
        </div>
      </div>

      <Footer />
    </main>
  );
}
