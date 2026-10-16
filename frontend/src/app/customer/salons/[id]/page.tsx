"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Scissors,
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
import BookingForm from "@/components/customers/booking-form";

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

        {/* Services */}
        <section id="services" className="mt-10 scroll-mt-24">
          <div className="mb-5">
            <p className="text-sm font-medium text-violet-600">
              Find your style
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Our services
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Explore the treatments available at {salon.name}.
            </p>
          </div>

          <Card className="overflow-hidden rounded-2xl">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="flex items-center gap-2">
                <Scissors className="size-5 text-violet-600" />
                Available services
              </CardTitle>
              <CardDescription>
                {services.length} service{services.length === 1 ? "" : "s"}{" "}
                available
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              {services.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No services are currently available.
                </p>
              ) : (
                <div className="divide-y">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-muted/20 sm:px-6"
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

                      <p className="shrink-0 text-base font-semibold tabular-nums sm:text-lg">
                        ₹{Number(service.price).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Booking */}
        <section id="book-appointment" className="mt-10 scroll-mt-24">
          <div className="mb-5">
            <p className="text-sm font-medium text-violet-600">
              Your next appointment
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Book your visit
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Choose your services and a convenient starting time. Your
              appointment will be scheduled according to the duration of each
              selected service.
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <BookingForm salonId={salon.id} services={services} />
          </div>
        </section>

        {/* Opening hours */}
        <section id="opening-hours" className="mt-10 scroll-mt-24">
          <div className="mb-5">
            <p className="text-sm font-medium text-violet-600">
              Plan your visit
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Opening hours
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Weekly business hours for {salon.name}.
            </p>
          </div>

          <Card className="rounded-2xl">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5 text-violet-600" />
                Weekly schedule
              </CardTitle>
              <CardDescription>
                Check when the salon is open before choosing your appointment.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              <div className="grid gap-x-10 sm:grid-cols-2">
                {DAYS.map(({ day, label }) => {
                  const item = hoursByDay.get(day);
                  const isClosed = !item || item.isClosed;

                  return (
                    <div
                      key={day}
                      className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0 sm:nth-last-2:border-b-0"
                    >
                      <span className="text-sm font-medium">{label}</span>

                      {isClosed ? (
                        <Badge variant="secondary">Closed</Badge>
                      ) : item?.opensAt && item?.closesAt ? (
                        <span className="text-right text-sm tabular-nums text-muted-foreground">
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
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            className="bg-violet-600 hover:bg-violet-700"
            onClick={() => {
              document.getElementById("book-appointment")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
          >
            <CalendarDays className="mr-2 size-4" />
            Book an appointment
          </Button>

          <Button variant="outline">
            <Link href="/customer/salons">Explore other salons</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
