"use client";

import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  RefreshCw,
  Store,
  XCircle,
} from "lucide-react";

import { getApiError } from "@/lib/api";
import { SalonCard } from "@/components/owner/salon-card";
import { useCurrentUser } from "@/hooks/use-auth";
import { useMySalons } from "@/hooks/use-salons";
import { useOwnerBookings } from "@/hooks/use-bookings";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function OwnerDashboardPage() {
  const currentUser = useCurrentUser();
  const salonsQuery = useMySalons();
  const bookingsQuery = useOwnerBookings();

  const user = currentUser.data;
  const salons = salonsQuery.data ?? [];
  const bookings = bookingsQuery.data ?? [];

  const isWrongRole = Boolean(user && user.role !== "OWNER");

  const salonStats = [
    {
      label: "Total salons",
      value: salons.length,
    },
    {
      label: "Published",
      value: salons.filter((salon) => salon.status === "PUBLISHED").length,
    },
    {
      label: "Drafts",
      value: salons.filter((salon) => salon.status === "DRAFT").length,
    },
    {
      label: "Unpublished",
      value: salons.filter((salon) => salon.status === "UNPUBLISHED").length,
    },
  ];

  const bookingStats = [
    {
      label: "Total bookings",
      value: bookings.length,
      description: "Across all your salons",
      icon: CalendarDays,
      iconStyle:
        "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    },
    {
      label: "Confirmed",
      value: bookings.filter((booking) => booking.status === "CONFIRMED")
        .length,
      description: "Appointments awaiting completion",
      icon: Clock,
      iconStyle:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    },
    {
      label: "Completed",
      value: bookings.filter((booking) => booking.status === "COMPLETED")
        .length,
      description: "Successfully completed appointments",
      icon: CheckCircle2,
      iconStyle:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    {
      label: "Cancelled",
      value: bookings.filter((booking) => booking.status === "CANCELLED")
        .length,
      description: "Cancelled appointments",
      icon: XCircle,
      iconStyle:
        "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        {isWrongRole ? (
          <Card>
            <CardContent className="p-6">
              Redirecting you to the correct dashboard...
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Dashboard heading */}
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <Badge variant="secondary" className="mb-3">
                  Owner workspace
                </Badge>

                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Your salons
                </h1>

                <p className="mt-2 text-muted-foreground">
                  {user?.email
                    ? `Welcome back, ${user.email}`
                    : "Manage your salon profiles, services, and opening hours."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void salonsQuery.refetch();
                    void bookingsQuery.refetch();
                  }}
                  disabled={salonsQuery.isFetching || bookingsQuery.isFetching}
                >
                  <RefreshCw
                    className={`size-4 ${
                      salonsQuery.isFetching || bookingsQuery.isFetching
                        ? "animate-spin"
                        : ""
                    }`}
                  />
                  Refresh
                </Button>

                <Link
                  href="/owner/salons/new"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Create salon
                </Link>
              </div>
            </div>

            {/* Current user error */}
            {currentUser.isError && (
              <Alert variant="destructive" className="mt-6">
                <AlertDescription>
                  {getApiError(currentUser.error)}
                </AlertDescription>
              </Alert>
            )}

            {/* Salon statistics */}
            <section className="mt-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {salonStats.map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>

                      {salonsQuery.isPending ? (
                        <Skeleton className="mt-2 h-9 w-16" />
                      ) : (
                        <p className="mt-2 text-3xl font-semibold tabular-nums">
                          {stat.value}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Booking overview */}
            <section className="mt-12 space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Booking overview
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Monitor appointments and manage customer bookings.
                  </p>
                </div>

                <Link
                  href="/owner/bookings"
                  className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <CalendarDays className="size-4" />
                  Manage bookings
                </Link>
              </div>

              {bookingsQuery.isError && (
                <Alert variant="destructive">
                  <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span>{getApiError(bookingsQuery.error)}</span>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => bookingsQuery.refetch()}
                    >
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Booking statistics cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {bookingStats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <Card
                      key={stat.label}
                      className="min-h-55 rounded-2xl border-border/70 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <CardContent className="flex min-h-55 flex-col justify-between p-6">
                        <div className="flex items-start justify-between gap-3">
                          <p className="pt-1 text-sm font-medium text-muted-foreground">
                            {stat.label}
                          </p>

                          <div
                            className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${stat.iconStyle}`}
                          >
                            <Icon className="size-6" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          {bookingsQuery.isPending ? (
                            <Skeleton className="h-12 w-20" />
                          ) : (
                            <p className="text-4xl font-bold tracking-tight tabular-nums">
                              {stat.value}
                            </p>
                          )}

                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {stat.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Salon loading error */}
            {salonsQuery.isError && (
              <Alert variant="destructive" className="mt-8">
                <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>{getApiError(salonsQuery.error)}</span>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => salonsQuery.refetch()}
                  >
                    Try again
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Salon loading skeletons */}
            {salonsQuery.isPending && (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <Card key={item}>
                    <CardContent className="space-y-4 p-5">
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty salon state */}
            {salonsQuery.isSuccess && salons.length === 0 && (
              <Card className="mt-8">
                <CardContent className="flex flex-col items-center px-6 py-14 text-center">
                  <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                    <Store className="size-8" />
                  </div>

                  <h2 className="text-xl font-semibold">
                    Create your first salon
                  </h2>

                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Add your salon profile, services, prices, and weekly opening
                    hours to get started on Snipr.
                  </p>

                  <Link
                    href="/owner/salons/new"
                    className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Get started
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Reusable salon cards */}
            {salonsQuery.isSuccess && salons.length > 0 && (
              <section className="mt-10">
                <div className="mb-5">
                  <h2 className="text-xl font-semibold">All salons</h2>

                  <p className="text-sm text-muted-foreground">
                    {salons.length} salon
                    {salons.length === 1 ? "" : "s"} in your workspace
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {salons.map((salon) => (
                    <SalonCard key={salon.id} salon={salon} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
