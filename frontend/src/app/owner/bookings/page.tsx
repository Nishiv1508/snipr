"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Search,
  TicketCheck,
  Users,
  XCircle,
  RefreshCw,
  EyeOff,
  Eye,
} from "lucide-react";

import { getApiError } from "@/lib/api";
import { useOwnerBookings, useVerifyBookingTicket } from "@/hooks/use-bookings";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type BookingStatus = "CONFIRMED" | "COMPLETED" | "CANCELLED";

type OwnerBooking = {
  id: string;
  reference: string;
  status: BookingStatus;
  createdAt: string;
  customer?: {
    id: string;
    email: string;
  };
  customerEmail?: string;
  items: {
    id: string;
    serviceName: string;
    servicePrice: string | number;
    serviceDurationMin: number;
    startsAt: string;
    endsAt: string;
  }[];
};

type StatusFilter = "ALL" | BookingStatus;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function getBookingTotal(booking: OwnerBooking) {
  return booking.items.reduce(
    (total, item) => total + Number(item.servicePrice),
    0,
  );
}

function getStatusVariant(status: BookingStatus) {
  switch (status) {
    case "CONFIRMED":
      return "default";
    case "COMPLETED":
      return "secondary";
    case "CANCELLED":
      return "destructive";
  }
}

function getTodayDateFilter() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const filters: { label: string; value: StatusFilter }[] = [
  { label: "All bookings", value: "ALL" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function OwnerBookingsPage() {
  const bookingsQuery = useOwnerBookings();
  const verifyMutation = useVerifyBookingTicket();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [ticketKeys, setTicketKeys] = useState<Record<string, string>>({});
  const [verificationErrors, setVerificationErrors] = useState<
    Record<string, string>
  >({});
  const [verificationResults, setVerificationResults] = useState<
    Record<string, string>
  >({});
  const [dateFilter, setDateFilter] = useState(getTodayDateFilter);
  const [showTicketKey, setShowTicketKey] = useState<Record<string, boolean>>(
    {},
  );

  const bookings = (bookingsQuery.data ?? []) as OwnerBooking[];

  const stats = useMemo(
    () => [
      {
        label: "Total bookings",
        value: bookings.length,
        icon: CalendarDays,
        iconStyle: "bg-violet-100 text-violet-700",
      },
      {
        label: "Confirmed",
        value: bookings.filter((b) => b.status === "CONFIRMED").length,
        icon: Clock3,
        iconStyle: "bg-blue-100 text-blue-700",
      },
      {
        label: "Completed",
        value: bookings.filter((b) => b.status === "COMPLETED").length,
        icon: CheckCircle2,
        iconStyle: "bg-emerald-100 text-emerald-700",
      },
      {
        label: "Cancelled",
        value: bookings.filter((b) => b.status === "CANCELLED").length,
        icon: XCircle,
        iconStyle: "bg-rose-100 text-rose-700",
      },
    ],
    [bookings],
  );

  const dateBookings = useMemo(() => {
    if (!dateFilter) return bookings;

    return bookings.filter((booking) =>
      booking.items.some((item) => {
        const appointmentDate = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(item.startsAt));

        return appointmentDate === dateFilter;
      }),
    );
  }, [bookings, dateFilter]);

  const filteredBookings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return bookings
      .filter((booking) => {
        const matchesStatus =
          statusFilter === "ALL" || booking.status === statusFilter;

        const customerEmail =
          booking.customer?.email ?? booking.customerEmail ?? "";

        const matchesSearch =
          !normalizedSearch ||
          booking.reference.toLowerCase().includes(normalizedSearch) ||
          customerEmail.toLowerCase().includes(normalizedSearch);

        const matchesDate =
          !dateFilter ||
          booking.items.some((item) => {
            const appointmentDate = new Intl.DateTimeFormat("en-CA", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date(item.startsAt));

            return appointmentDate === dateFilter;
          });

        return matchesStatus && matchesSearch && matchesDate;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [bookings, search, statusFilter, dateFilter]);

  async function handleVerify(bookingId: string) {
    const key = ticketKeys[bookingId]?.trim();

    if (!key) {
      setVerificationErrors((previous) => ({
        ...previous,
        [bookingId]: "Enter the ticket verification key.",
      }));
      return;
    }

    setVerificationErrors((previous) => ({
      ...previous,
      [bookingId]: "",
    }));
    setVerificationResults((previous) => ({
      ...previous,
      [bookingId]: "",
    }));

    try {
      const result = await verifyMutation.mutateAsync({
        bookingId,
        input: { key },
      });

      setVerificationResults((previous) => ({
        ...previous,
        [bookingId]: result.valid
          ? "Ticket verified successfully."
          : "This ticket could not be verified.",
      }));
    } catch (error) {
      setVerificationErrors((previous) => ({
        ...previous,
        [bookingId]: getApiError(error),
      }));
    }
  }

  if (bookingsQuery.isPending) {
    return (
      <main className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8 sm:py-12">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-42.5 rounded-2xl" />
          ))}
        </div>

        <Skeleton className="h-14 w-full rounded-xl" />

        {[1, 2].map((item) => (
          <Skeleton key={item} className="h-72 rounded-2xl" />
        ))}
      </main>
    );
  }

  if (bookingsQuery.isError) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <Alert variant="destructive">
          <AlertTitle>Unable to load bookings</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{getApiError(bookingsQuery.error)}</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => bookingsQuery.refetch()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8 sm:py-12">
        {/* Heading */}
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Badge variant="secondary" className="mb-3">
              Owner workspace
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Manage bookings
            </h1>
            <p className="mt-2 text-muted-foreground">
              View appointments, track booking statuses, and verify customer
              tickets.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => bookingsQuery.refetch()}
            disabled={bookingsQuery.isFetching}
          >
            <RefreshCw
              className={`mr-2 size-4 ${
                bookingsQuery.isFetching ? "animate-spin" : ""
              }`}
            />
            Refresh bookings
          </Button>
        </section>

        {/* Statistics */}
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card
                key={stat.label}
                className="min-h-42.5 rounded-2xl shadow-sm transition-shadow hover:shadow-md"
              >
                <CardContent className="flex min-h-42.5 flex-col justify-between p-6">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <div
                      className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${stat.iconStyle}`}
                    >
                      <Icon className="size-6" />
                    </div>
                  </div>

                  <p className="text-4xl font-bold tracking-tight tabular-nums">
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* Search and filters */}
        {/* Search and filters */}
        <section className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search booking reference or customer email..."
                className="h-12 rounded-xl pl-10"
                aria-label="Search bookings"
              />
            </div>

            <Input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="h-12 rounded-xl"
              aria-label="Filter by appointment date"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter.value}
                type="button"
                size="sm"
                variant={statusFilter === filter.value ? "default" : "outline"}
                onClick={() => setStatusFilter(filter.value)}
                className="rounded-full"
              >
                {filter.label}
                <span className="ml-1 opacity-75">
                  {filter.value === "ALL"
                    ? dateBookings.length
                    : dateBookings.filter(
                        (booking) => booking.status === filter.value,
                      ).length}
                </span>
              </Button>
            ))}
          </div>

          {(search || dateFilter || statusFilter !== "ALL") && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setDateFilter(getTodayDateFilter());
                  setStatusFilter("ALL");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </section>

        {/* Booking list */}
        <section className="space-y-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-semibold">Appointments</h2>
              <p className="text-sm text-muted-foreground">
                {filteredBookings.length}{" "}
                {filteredBookings.length === 1 ? "booking" : "bookings"} found
              </p>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="flex flex-col items-center px-6 py-14 text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
                  <CalendarDays className="size-7 text-muted-foreground" />
                </div>

                <h3 className="text-lg font-semibold">
                  {bookings.length === 0
                    ? "No bookings yet"
                    : "No matching bookings"}
                </h3>

                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  {bookings.length === 0
                    ? "Customer appointments will appear here when a booking is made."
                    : "Try changing the status filter or search term."}
                </p>

                {(search || statusFilter !== "ALL") && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-5"
                    onClick={() => {
                      setSearch("");
                      setDateFilter(getTodayDateFilter());
                      setStatusFilter("ALL");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-5">
              {filteredBookings.map((booking) => {
                const customerEmail =
                  booking.customer?.email ??
                  booking.customerEmail ??
                  "Customer email unavailable";

                return (
                  <Card
                    key={booking.id}
                    className="overflow-hidden rounded-2xl shadow-sm"
                  >
                    <CardHeader className="flex flex-col gap-4 border-b bg-muted/20 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-lg">
                            Booking #{booking.reference}
                          </CardTitle>
                          <Badge variant={getStatusVariant(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>

                        <p className="flex items-center gap-2 break-all text-sm text-muted-foreground">
                          <Users className="size-4 shrink-0" />
                          {customerEmail}
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-xs text-muted-foreground">
                          Booking total
                        </p>
                        <p className="text-2xl font-bold tracking-tight">
                          {formatPrice(getBookingTotal(booking))}
                        </p>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6 p-5 sm:p-6">
                      {/* Service details */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold">
                          Booked services
                        </h3>

                        {booking.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                          >
                            <div className="space-y-1">
                              <p className="font-medium">{item.serviceName}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(item.startsAt)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.serviceDurationMin} minutes
                              </p>
                            </div>

                            <p className="font-semibold sm:text-right">
                              {formatPrice(Number(item.servicePrice))}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-2 border-t pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-muted-foreground">
                          Created {formatDate(booking.createdAt)}
                        </p>
                        <p className="font-medium">
                          {booking.items.length}{" "}
                          {booking.items.length === 1 ? "service" : "services"}
                        </p>
                      </div>

                      {/* Ticket verification */}
                      {booking.status === "CONFIRMED" && (
                        <div className="space-y-4 rounded-xl border bg-muted/20 p-4 sm:p-5">
                          <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <TicketCheck className="size-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                Verify customer ticket
                              </h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Enter the verification key from the customer's
                                ticket.
                              </p>
                            </div>
                          </div>

                          <form
                            className="space-y-3 sm:flex sm:items-end sm:gap-3 sm:space-y-0"
                            onSubmit={(event) => {
                              event.preventDefault();
                              void handleVerify(booking.id);
                            }}
                          >
                            <div className="flex-1 space-y-2">
                              <Label htmlFor={`ticket-key-${booking.id}`}>
                                Ticket key
                              </Label>

                              <div className="relative">
                                <Input
                                  id={`ticket-key-${booking.id}`}
                                  type={
                                    showTicketKey[booking.id]
                                      ? "text"
                                      : "password"
                                  }
                                  autoComplete="off"
                                  placeholder="Enter ticket verification key"
                                  value={ticketKeys[booking.id] ?? ""}
                                  onChange={(event) =>
                                    setTicketKeys((previous) => ({
                                      ...previous,
                                      [booking.id]: event.target.value,
                                    }))
                                  }
                                  className="pr-10"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowTicketKey((previous) => ({
                                      ...previous,
                                      [booking.id]: !previous[booking.id],
                                    }))
                                  }
                                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                                  aria-label={
                                    showTicketKey[booking.id]
                                      ? "Hide ticket key"
                                      : "Show ticket key"
                                  }
                                >
                                  {showTicketKey[booking.id] ? (
                                    <EyeOff className="size-4" />
                                  ) : (
                                    <Eye className="size-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <Button
                              type="submit"
                              className="w-full sm:w-auto"
                              disabled={verifyMutation.isPending}
                            >
                              {verifyMutation.isPending
                                ? "Verifying..."
                                : "Verify ticket"}
                            </Button>
                          </form>

                          {verificationErrors[booking.id] && (
                            <Alert variant="destructive">
                              <AlertDescription>
                                {verificationErrors[booking.id]}
                              </AlertDescription>
                            </Alert>
                          )}

                          {verificationResults[booking.id] && (
                            <Alert>
                              <AlertDescription>
                                {verificationResults[booking.id]}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
