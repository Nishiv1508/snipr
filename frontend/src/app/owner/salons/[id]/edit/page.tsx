"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { ArrowLeft, Clock, Plus, Scissors, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { OwnerNavbar } from "@/components/owner/navbar";
import { getApiError } from "@/lib/api";
import { useSalon, useUpdateSalon } from "@/hooks/use-salons";

import type { Salon, SalonHoursInput, WeekDay } from "@/lib/api/salon.api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const DASHBOARD_ROUTE = "/owner/dashboard";

const DAYS: { day: WeekDay; label: string }[] = [
  { day: "MONDAY", label: "Monday" },
  { day: "TUESDAY", label: "Tuesday" },
  { day: "WEDNESDAY", label: "Wednesday" },
  { day: "THURSDAY", label: "Thursday" },
  { day: "FRIDAY", label: "Friday" },
  { day: "SATURDAY", label: "Saturday" },
  { day: "SUNDAY", label: "Sunday" },
];

interface SalonFormValues {
  name: string;
  description: string;
  imageUrl: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  googleMapsUrl: string;
}

interface ServiceDraft {
  // Keep the database ID for existing services. New drafts have no ID.
  id?: string;
  name: string;
  description: string;
  durationMin: string;
  price: string;
}

interface HoursDraft {
  day: WeekDay;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
}

const emptyService = (): ServiceDraft => ({
  name: "",
  description: "",
  durationMin: "30",
  price: "",
});

function getSalonHours(salon: Salon): HoursDraft[] {
  // Keep all seven days in the form, even if the API returns
  // only the days that have explicitly configured hours.
  const savedHours = salon.hours ?? [];

  return DAYS.map(({ day }) => {
    const saved = savedHours.find((item) => item.day === day);

    return {
      day,
      opensAt: saved?.opensAt ?? (day === "SATURDAY" ? "10:00" : "09:00"),
      closesAt: saved?.closesAt ?? (day === "SATURDAY" ? "22:00" : "21:00"),
      isClosed: saved?.isClosed ?? false,
    };
  });
}

function getSalonServices(salon: Salon): ServiceDraft[] {
  if (!salon.services?.length) {
    return [emptyService()];
  }

  return salon.services.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description ?? "",
    durationMin: String(service.durationMin),
    price: String(service.price),
  }));
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default function EditSalonPage() {
  const params = useParams<{ id: string }>();
  const salonId = params.id;

  const salonQuery = useSalon(salonId);

  if (salonQuery.isPending) {
    return (
      <div className="min-h-screen bg-muted/20">
        <main className="mx-auto max-w-4xl space-y-6 px-5 py-8 sm:px-8 sm:py-12">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (salonQuery.isError || !salonQuery.data) {
    return (
      <div className="min-h-screen bg-muted/20">
        <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
          <Link
            href={DASHBOARD_ROUTE}
            className="mb-6 inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>

          <Alert variant="destructive">
            <AlertDescription>
              {salonQuery.isError
                ? getApiError(salonQuery.error)
                : "Salon not found."}
            </AlertDescription>
          </Alert>

          <Button
            className="mt-4"
            variant="outline"
            onClick={() => salonQuery.refetch()}
          >
            Try again
          </Button>
        </main>
      </div>
    );
  }

  return <EditSalonForm key={salonQuery.data.id} salon={salonQuery.data} />;
}

function EditSalonForm({ salon }: { salon: Salon }) {
  const router = useRouter();
  const updateSalonMutation = useUpdateSalon();

  const [services, setServices] = useState<ServiceDraft[]>(() =>
    getSalonServices(salon),
  );
  const [hours, setHours] = useState<HoursDraft[]>(() => getSalonHours(salon));
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SalonFormValues>({
    defaultValues: {
      name: salon.name ?? "",
      description: salon.description ?? "",
      imageUrl: salon.imageUrl ?? "",
      address: salon.address ?? "",
      city: salon.city ?? "",
      state: salon.state ?? "",
      postalCode: salon.postalCode ?? "",
      phone: salon.phone ?? "",
      googleMapsUrl: salon.googleMapsUrl ?? "",
    },
    mode: "onBlur",
  });

  function updateService(
    index: number,
    field: keyof ServiceDraft,
    value: string,
  ) {
    setServices((current) =>
      current.map((service, i) =>
        i === index ? { ...service, [field]: value } : service,
      ),
    );
  }

  function updateHours(
    index: number,
    field: keyof HoursDraft,
    value: string | boolean,
  ) {
    setHours((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function validateDynamicFields(): string | null {
    if (services.length === 0) {
      return "Add at least one service.";
    }

    for (let i = 0; i < services.length; i++) {
      const service = services[i];

      if (!service.name.trim()) {
        return `Enter a name for service ${i + 1}.`;
      }

      if (service.name.trim().length > 120) {
        return `Service ${i + 1} name must be 120 characters or fewer.`;
      }

      const duration = Number(service.durationMin);
      const price = Number(service.price);

      if (!Number.isInteger(duration) || duration <= 0) {
        return `Service ${i + 1} must have a positive whole-number duration.`;
      }

      if (service.price.trim() === "" || !Number.isFinite(price) || price < 0) {
        return `Enter a valid price for service ${i + 1}.`;
      }
    }

    for (const item of hours) {
      if (item.isClosed) continue;

      if (!item.opensAt || !item.closesAt) {
        return `Set opening and closing times for ${item.day.toLowerCase()}.`;
      }

      if (item.opensAt >= item.closesAt) {
        return `Closing time must be later than opening time on ${item.day.toLowerCase()}. Overnight hours are not supported.`;
      }
    }

    return null;
  }

  async function onSubmit(values: SalonFormValues) {
    setFormError("");

    const dynamicError = validateDynamicFields();

    if (dynamicError) {
      setFormError(dynamicError);
      return;
    }

    if (values.imageUrl.trim() && !isValidUrl(values.imageUrl.trim())) {
      setFormError("Enter a valid image URL.");
      return;
    }

    if (
      values.googleMapsUrl.trim() &&
      !isValidUrl(values.googleMapsUrl.trim())
    ) {
      setFormError("Enter a valid Google Maps URL.");
      return;
    }

    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      imageUrl: values.imageUrl.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      state: values.state.trim(),
      postalCode: values.postalCode.trim(),
      phone: values.phone.trim(),
      googleMapsUrl: values.googleMapsUrl.trim(),

      services: services.map((service) => ({
        ...(service.id ? { id: service.id } : {}),
        name: service.name.trim(),
        description: service.description.trim(),
        durationMin: Number(service.durationMin),
        price: Number(service.price),
      })),

      hours: hours.map((item): SalonHoursInput => {
        if (item.isClosed) {
          return {
            day: item.day,
            isClosed: true,
          };
        }

        return {
          day: item.day,
          opensAt: item.opensAt,
          closesAt: item.closesAt,
          isClosed: false,
        };
      }),
    };

    try {
      await updateSalonMutation.mutateAsync({
        id: salon.id,
        input: payload,
      });

      toast.success("Salon updated successfully.");
      router.push(DASHBOARD_ROUTE);
    } catch (error) {
      setFormError(getApiError(error));
    }
  }

  const isSaving = updateSalonMutation.isPending;

  return (
    <div className="min-h-screen bg-muted/20">
      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          href={DASHBOARD_ROUTE}
          className="mb-6 inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:h-11 sm:px-4"
        >
          <ArrowLeft className="size-4 shrink-0" />
          <span>Back to dashboard</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Edit your salon
          </h1>
          <p className="mt-2 text-muted-foreground">
            Update {salon.name}, its services, and weekly opening hours.
          </p>
        </div>

        {formError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Salon information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="size-5" />
                Salon information
              </CardTitle>
              <CardDescription>
                Update the information customers see on your salon profile.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Salon name *</Label>
                <Input
                  id="name"
                  maxLength={150}
                  {...register("name", {
                    required: "Salon name is required.",
                    maxLength: {
                      value: 150,
                      message: "Salon name must be 150 characters or fewer.",
                    },
                  })}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  {...register("description")}
                  placeholder="Describe your salon and what makes it special..."
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="imageUrl">Salon image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  {...register("imageUrl")}
                  placeholder="https://example.com/salon.jpg"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Street address *</Label>
                <Input
                  id="address"
                  {...register("address", {
                    required: "Street address is required.",
                  })}
                  aria-invalid={!!errors.address}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  {...register("city", { required: "City is required." })}
                  aria-invalid={!!errors.city}
                />
                {errors.city && (
                  <p className="text-sm text-destructive">
                    {errors.city.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  {...register("state", { required: "State is required." })}
                  aria-invalid={!!errors.state}
                />
                {errors.state && (
                  <p className="text-sm text-destructive">
                    {errors.state.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal code</Label>
                <Input id="postalCode" {...register("postalCode")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Contact phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  placeholder="+919876543210"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
                <Input
                  id="googleMapsUrl"
                  type="url"
                  {...register("googleMapsUrl")}
                  placeholder="https://maps.google.com/?q=Ahmedabad"
                />
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Scissors className="size-5" />
                    Services and pricing
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Manage the services customers can book.
                  </CardDescription>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setServices((current) => [...current, emptyService()])
                  }
                >
                  <Plus className="mr-2 size-4" />
                  Add service
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {services.map((service, index) => (
                <div key={index} className="rounded-xl border p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-medium">Service {index + 1}</h3>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove service ${index + 1}`}
                      disabled={services.length === 1}
                      onClick={() =>
                        setServices((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Service name *</Label>
                      <Input
                        value={service.name}
                        maxLength={120}
                        onChange={(e) =>
                          updateService(index, "name", e.target.value)
                        }
                        placeholder="Haircut"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Price (₹) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={service.price}
                        onChange={(e) =>
                          updateService(index, "price", e.target.value)
                        }
                        placeholder="250"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Duration (minutes) *</Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={service.durationMin}
                        onChange={(e) =>
                          updateService(index, "durationMin", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={service.description}
                        onChange={(e) =>
                          updateService(index, "description", e.target.value)
                        }
                        placeholder="Describe the service..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Opening hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5" />
                Weekly opening hours
              </CardTitle>
              <CardDescription>
                Set opening and closing times for each day.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {hours.map((item, index) => (
                <div
                  key={item.day}
                  className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
                >
                  <div className="font-medium">{DAYS[index].label}</div>

                  <div className="space-y-2">
                    <Label htmlFor={`open-${item.day}`}>Opens</Label>
                    <Input
                      id={`open-${item.day}`}
                      type="time"
                      value={item.opensAt}
                      disabled={item.isClosed}
                      onChange={(e) =>
                        updateHours(index, "opensAt", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`close-${item.day}`}>Closes</Label>
                    <Input
                      id={`close-${item.day}`}
                      type="time"
                      value={item.closesAt}
                      disabled={item.isClosed}
                      onChange={(e) =>
                        updateHours(index, "closesAt", e.target.value)
                      }
                    />
                  </div>

                  <div className="flex items-center gap-2 pb-2">
                    <Checkbox
                      id={`closed-${item.day}`}
                      checked={item.isClosed}
                      onCheckedChange={(checked) =>
                        updateHours(index, "isClosed", checked === true)
                      }
                    />
                    <Label
                      htmlFor={`closed-${item.day}`}
                      className="cursor-pointer"
                    >
                      Closed
                    </Label>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Form actions */}
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Button type="button" variant="outline">
              <Link href={DASHBOARD_ROUTE}>Cancel</Link>
            </Button>

            <Button type="submit" disabled={isSaving} className="sm:min-w-44">
              {isSaving ? "Saving changes..." : "Save changes"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
