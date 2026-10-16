"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  Clock3,
  Scissors,
  Ticket,
  LoaderCircle,
  ArrowRight,
  CalendarCheck,
  RotateCcw,
  XCircle,
} from "lucide-react";

import {
  useMyBookings,
  useCancelBooking,
  useDownloadBookingTicket,
} from "@/hooks/use-bookings";
import { getApiError } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatAppointmentTime(value: string, timezone = "Asia/Kolkata") {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));
}

function getStatusVariant(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "default" as const;
    case "CANCELLED":
      return "destructive" as const;
    case "COMPLETED":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export default function CustomerBookingsPage() {
  const bookingsQuery = useMyBookings();
  const cancelMutation = useCancelBooking();
  const ticketMutation = useDownloadBookingTicket();

  const [actionError, setActionError] = useState<string | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(
    null,
  );

  async function handleCancel(bookingId: string) {
    setActionError(null);
    setCancellingBookingId(bookingId);

    try {
      await cancelMutation.mutateAsync(bookingId);
    } catch (error) {
      setActionError(getApiError(error));
    } finally {
      setCancellingBookingId(null);
    }
  }

  async function handleDownload(bookingId: string) {
    setActionError(null);

    try {
      await ticketMutation.mutateAsync(bookingId);
    } catch (error) {
      setActionError(getApiError(error));
    }
  }

  const bookings = bookingsQuery.data ?? [];

  const upcomingBookings = bookings.filter(
    (booking) =>
      booking.status === "CONFIRMED" &&
      booking.items.some((item) => new Date(item.endsAt) >= new Date()),
  );

  const otherBookings = bookings.filter(
    (booking) => !upcomingBookings.some((item) => item.id === booking.id),
  );

  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-violet-600">
              YOUR SNIPR ACCOUNT
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              My bookings
            </h1>
            <p className="mt-2 text-muted-foreground">
              Keep track of your appointments and tickets in one place.
            </p>
          </div>

          <Button className="bg-violet-600 hover:bg-violet-700">
            <Link href="/customer/salons">Explore salons</Link>
          </Button>
        </div>

        {actionError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        {bookingsQuery.isPending ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-56 w-full rounded-2xl" />
            ))}
          </div>
        ) : bookingsQuery.isError ? (
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <CalendarCheck className="size-10 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold">
                Couldn't load your bookings
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {getApiError(bookingsQuery.error)}
              </p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => bookingsQuery.refetch()}
              >
                <RotateCcw className="mr-2 size-4" />
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : bookings.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex flex-col items-center px-6 py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                <CalendarDays className="size-8" />
              </div>

              <h2 className="mt-5 text-xl font-semibold">No bookings yet</h2>

              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Your next great look starts with an appointment. Explore salons
                and book your first visit.
              </p>

              <Button className="mt-6 bg-violet-600 hover:bg-violet-700">
                <Link href="/customer/salons">
                  Find a salon
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {upcomingBookings.length > 0 && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    Upcoming appointments
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your confirmed bookings.
                  </p>
                </div>

                {upcomingBookings.map((booking) => (
                  <Card
                    key={booking.id}
                    className="overflow-hidden rounded-2xl border-border/70 shadow-sm"
                  >
                    <CardHeader className="flex flex-col gap-3 border-b bg-background px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Booking reference
                        </p>
                        <CardTitle className="mt-1 text-lg">
                          {booking.reference}
                        </CardTitle>
                      </div>

                      <Badge variant={getStatusVariant(booking.status)}>
                        {booking.status}
                      </Badge>
                    </CardHeader>

                    <CardContent className="space-y-5 p-5 sm:p-6">
                      <div className="space-y-4">
                        {booking.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between gap-4"
                          >
                            <div className="flex min-w-0 gap-3">
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                                <Scissors className="size-5" />
                              </div>

                              <div>
                                <p className="font-medium">
                                  {item.serviceName}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {item.serviceDurationMin} minutes
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {formatAppointmentTime(item.startsAt)} –{" "}
                                  {formatAppointmentTime(item.endsAt)}
                                </p>
                              </div>
                            </div>

                            <p className="shrink-0 font-medium tabular-nums">
                              {formatPrice(item.servicePrice)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl bg-muted/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-muted-foreground">
                            Total
                          </span>
                          <span className="text-lg font-semibold">
                            {formatPrice(
                              booking.items.reduce(
                                (sum, item) => sum + Number(item.servicePrice),
                                0,
                              ),
                            )}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Clock3 className="size-4" />
                            Total duration
                          </span>
                          <span>
                            {booking.items.reduce(
                              (sum, item) => sum + item.serviceDurationMin,
                              0,
                            )}{" "}
                            minutes
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          className="flex-1 bg-violet-600 hover:bg-violet-700"
                          onClick={() => handleDownload(booking.id)}
                          disabled={ticketMutation.isPending}
                        >
                          {ticketMutation.isPending ? (
                            <LoaderCircle className="mr-2 size-4 animate-spin" />
                          ) : (
                            <Ticket className="mr-2 size-4" />
                          )}
                          Download ticket
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                            <XCircle className="size-4" />
                            Cancel Booking
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Cancel this appointment?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will cancel booking {booking.reference}.
                                You can book another appointment later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                Keep booking
                              </AlertDialogCancel>
                              <AlertDialogAction
                                disabled={cancellingBookingId === booking.id}
                                onClick={() => handleCancel(booking.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {cancellingBookingId === booking.id
                                  ? "Cancelling..."
                                  : "Confirm cancellation"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </section>
            )}

            {otherBookings.length > 0 && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Booking history</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Previous and cancelled appointments.
                  </p>
                </div>

                {otherBookings.map((booking) => (
                  <Card key={booking.id} className="rounded-2xl">
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{booking.reference}</h3>
                          <Badge variant={getStatusVariant(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>

                        <p className="mt-2 text-sm text-muted-foreground">
                          {booking.items
                            .map((item) => item.serviceName)
                            .join(", ")}
                        </p>

                        {booking.items[0] && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatAppointmentTime(booking.items[0].startsAt)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-semibold">
                          {formatPrice(
                            booking.items.reduce(
                              (sum, item) => sum + Number(item.servicePrice),
                              0,
                            ),
                          )}
                        </span>

                        {booking.status === "CONFIRMED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(booking.id)}
                            disabled={ticketMutation.isPending}
                          >
                            <Ticket className="mr-2 size-4" />
                            Ticket
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
