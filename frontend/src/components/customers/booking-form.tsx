"use client";

import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  CalendarDays,
  Clock3,
  Scissors,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";

import {
  useAvailableSlots,
  useCreateBooking,
  useDownloadBookingTicket,
} from "@/hooks/use-bookings";
import { getApiError } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SalonService = {
  id: string;
  name: string;
  description?: string | null;
  price: string | number;
  durationMin: number;
  isActive?: boolean;
};

type BookingFormValues = {
  serviceIds: string[];
  slotId: string;
};

type BookingFormProps = {
  salonId: string;
  services: SalonService[];
};

function getLocalDateValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(value: string, timezone = "Asia/Kolkata") {
  // Slot data can briefly be unavailable while the selected date is refreshing.
  // Never pass an empty or invalid date to Intl.DateTimeFormat.
  if (!value) return "Time unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone,
    }).format(date);
  } catch {
    // Fall back safely if the API returns an invalid timezone identifier.
    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    }).format(date);
  }
}

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default function BookingForm({ salonId, services }: BookingFormProps) {
  const [date, setDate] = useState(getLocalDateValue());
  const [successReference, setSuccessReference] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const form = useForm<BookingFormValues>({
    defaultValues: {
      serviceIds: [],
      slotId: "",
    },
  });

  const selectedServiceIds = form.watch("serviceIds");
  const selectedSlotId = form.watch("slotId");

  const slotsQuery = useAvailableSlots(salonId, date);
  const createBookingMutation = useCreateBooking();
  const downloadTicketMutation = useDownloadBookingTicket();

  const activeServices = useMemo(
    () => services.filter((service) => service.isActive !== false),
    [services],
  );

  const selectedServices = useMemo(
    () =>
      activeServices.filter((service) =>
        selectedServiceIds.includes(service.id),
      ),
    [activeServices, selectedServiceIds],
  );

  const totalPrice = selectedServices.reduce(
    (sum, service) => sum + Number(service.price),
    0,
  );

  const totalDuration = selectedServices.reduce(
    (sum, service) => sum + service.durationMin,
    0,
  );

  const slotsData = slotsQuery.data;
  const slots = slotsData?.slots ?? [];
  const timezone = slotsData?.timezone ?? "Asia/Kolkata";

  function changeDate(value: string) {
    setDate(value);
    form.setValue("slotId", "", { shouldValidate: true });
    setSuccessReference(null);
    setRequestError(null);
  }

  async function onSubmit(values: BookingFormValues) {
    setRequestError(null);
    setSuccessReference(null);

    let booking;

    try {
      booking = await createBookingMutation.mutateAsync({
        slotId: values.slotId,
        serviceIds: values.serviceIds,
      });
    } catch (error) {
      setRequestError(getApiError(error));
      return;
    }

    setSuccessReference(booking.reference);
    form.reset({ serviceIds: [], slotId: "" });

    try {
      await downloadTicketMutation.mutateAsync(booking.id);
    } catch {
      setRequestError(
        "Booking confirmed, but automatic ticket download failed. Open My Bookings to try again.",
      );
    }
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
      <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-2 text-violet-600">
          <Scissors className="size-5" />
          <span className="text-sm font-medium">SNIPR APPOINTMENTS</span>
        </div>

        <CardTitle className="text-2xl font-semibold tracking-tight">
          Book your appointment
        </CardTitle>

        <p className="text-sm text-muted-foreground">
          Select your services, then choose a convenient time.
        </p>
      </CardHeader>

      <CardContent className="space-y-8 p-5 sm:p-6">
        {successReference && (
          <div
            role="status"
            className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
          >
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">Booking confirmed!</p>
              <p className="mt-1 text-sm">
                Your reference:{" "}
                <span className="font-semibold">{successReference}</span>
              </p>
              <p className="mt-1 text-sm">
                View your appointment in My Bookings.
              </p>
            </div>
          </div>
        )}

        {requestError && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {requestError}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Step 1: Services */}
          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                Step 01
              </p>
              <h3 className="mt-1 text-lg font-semibold">Choose services</h3>
              <p className="text-sm text-muted-foreground">
                Select up to 10 services. They will be performed in this order.
              </p>
            </div>

            <Controller
              control={form.control}
              name="serviceIds"
              rules={{
                validate: (value) =>
                  (value.length >= 1 && value.length <= 10) ||
                  "Select between 1 and 10 services.",
              }}
              render={({ field, fieldState }) => (
                <div className="space-y-3">
                  {activeServices.length === 0 && (
                    <p className="rounded-lg border p-4 text-sm text-muted-foreground">
                      No services are currently available.
                    </p>
                  )}

                  {activeServices.map((service) => {
                    const checked = field.value.includes(service.id);

                    return (
                      <label
                        key={service.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                          checked
                            ? "border-violet-500 bg-violet-500/5"
                            : "hover:border-violet-300"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => {
                            const isChecked = value === true;

                            if (isChecked) {
                              if (field.value.length >= 10) return;

                              field.onChange([...field.value, service.id]);
                            } else {
                              field.onChange(
                                field.value.filter((id) => id !== service.id),
                              );
                            }

                            form.setValue("slotId", "");
                            setSuccessReference(null);
                          }}
                          className="mt-1"
                          aria-label={`Select ${service.name}`}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{service.name}</p>

                          {service.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {service.description}
                            </p>
                          )}

                          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock3 className="size-3.5" />
                            {service.durationMin} minutes
                          </div>
                        </div>

                        <span className="shrink-0 font-semibold">
                          {formatPrice(service.price)}
                        </span>
                      </label>
                    );
                  })}

                  {fieldState.error && (
                    <p className="text-sm text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
          </section>

          <Separator />

          {/* Step 2: Date */}
          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                Step 02
              </p>
              <h3 className="mt-1 text-lg font-semibold">Choose a date</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-date">Appointment date</Label>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  id="booking-date"
                  type="date"
                  min={getLocalDateValue()}
                  value={date}
                  onChange={(event) => changeDate(event.target.value)}
                  required
                  className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Times are displayed in {timezone}.
              </p>
            </div>
          </section>

          <Separator />

          {/* Step 3: Slot */}
          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                Step 03
              </p>
              <h3 className="mt-1 text-lg font-semibold">
                Choose a starting time
              </h3>
              <p className="text-sm text-muted-foreground">
                Your selected services will run consecutively from this time.
              </p>
            </div>

            {selectedServices.length === 0 ? (
              <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                Select at least one service to continue.
              </p>
            ) : slotsQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border p-6 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Loading available times...
              </div>
            ) : slotsQuery.isError ? (
              <div className="space-y-3 rounded-xl border p-4">
                <p className="text-sm text-destructive">
                  {getApiError(slotsQuery.error)}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => slotsQuery.refetch()}
                >
                  Try again
                </Button>
              </div>
            ) : slots.length === 0 ? (
              <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                No starting times are available for this date. Try another day.
              </p>
            ) : (
              <Controller
                control={form.control}
                name="slotId"
                rules={{ required: "Choose an available starting time." }}
                render={({ field, fieldState }) => (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {slots.map((slot) => {
                        const selected = field.value === slot.id;
                        const unavailable =
                          !slot.isAvailable || slot.availableCount <= 0;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={unavailable}
                            onClick={() => {
                              field.onChange(slot.id);
                              setSuccessReference(null);
                              setRequestError(null);
                            }}
                            className={`rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                              selected
                                ? "border-violet-600 bg-violet-600 text-white"
                                : "hover:border-violet-400"
                            }`}
                          >
                            <span className="block text-sm font-semibold">
                              {formatTime(slot.startsAt, timezone)}
                            </span>
                            <span
                              className={`mt-1 block text-xs ${
                                selected
                                  ? "text-violet-100"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {unavailable
                                ? "Fully booked"
                                : `${slot.availableCount} available`}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {fieldState.error && (
                      <p className="text-sm text-destructive">
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            )}
          </section>

          {/* Summary */}
          <div className="rounded-2xl bg-muted/40 p-4 sm:p-5">
            <h3 className="font-semibold">Booking summary</h3>

            {selectedServices.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Your selected services will appear here.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {selectedServices.map((service, index) => (
                  <div
                    key={service.id}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {index + 1}. {service.name}
                    </span>
                    <span className="shrink-0">
                      {formatPrice(service.price)}
                    </span>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total duration</span>
                  <span className="font-medium">{totalDuration} min</span>
                </div>

                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>

                {selectedSlotId && (
                  <p className="text-sm text-muted-foreground">
                    Starts at{" "}
                    {formatTime(
                      slots.find((slot) => slot.id === selectedSlotId)
                        ?.startsAt ?? "",
                      timezone,
                    )}
                  </p>
                )}
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={() => setConfirmOpen(true)}
            size="lg"
            className="w-full bg-violet-600 hover:bg-violet-700"
            disabled={
              selectedServices.length === 0 ||
              !selectedSlotId ||
              createBookingMutation.isPending
            }
          >
            {createBookingMutation.isPending ? (
              <>
                <LoaderCircle className="mr-2 size-4 animate-spin" />
                Confirming booking...
              </>
            ) : (
              "Confirm appointment"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Your appointment is confirmed only after the booking request
            succeeds.
          </p>

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Place booking?</AlertDialogTitle>
                <AlertDialogDescription>
                  Please review your appointment details before confirming.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-3 rounded-xl border bg-muted/30 p-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground">Date</span>
                  <span className="text-right font-medium">
                    {new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground">Time</span>
                  <span className="text-right font-medium">
                    {formatTime(
                      slots.find((slot) => slot.id === selectedSlotId)
                        ?.startsAt ?? "",
                      timezone,
                    )}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Services</span>
                  {selectedServices.map((service) => (
                    <div key={service.id} className="font-medium">
                      {service.name}
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Total amount</span>
                  <span className="text-lg font-semibold">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>

              <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
                <AlertDialogCancel className="mt-0">Go back</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(event) => {
                    event.preventDefault();
                    setConfirmOpen(false);
                    void form.handleSubmit(onSubmit)();
                  }}
                  disabled={createBookingMutation.isPending}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {createBookingMutation.isPending
                    ? "Placing booking…"
                    : "Yes, place booking"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </form>
      </CardContent>
    </Card>
  );
}
