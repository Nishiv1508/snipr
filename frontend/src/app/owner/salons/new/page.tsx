"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Store, Scissors, Clock } from "lucide-react";
import { toast } from "sonner";

import { getApiError } from "@/lib/api";
import { useCreateSalon } from "@/hooks/use-salons";

import type {
  CreateSalonInput,
  SalonHoursInput,
  SalonServiceInput,
  WeekDay,
} from "@/lib/api/salon.api";

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

const DAYS: { day: WeekDay; label: string }[] = [
  { day: "MONDAY", label: "Monday" },
  { day: "TUESDAY", label: "Tuesday" },
  { day: "WEDNESDAY", label: "Wednesday" },
  { day: "THURSDAY", label: "Thursday" },
  { day: "FRIDAY", label: "Friday" },
  { day: "SATURDAY", label: "Saturday" },
  { day: "SUNDAY", label: "Sunday" },
];

interface ServiceDraft {
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

const defaultHours: HoursDraft[] = DAYS.map(({ day }) => ({
  day,
  opensAt: day === "SATURDAY" ? "10:00" : "09:00",
  closesAt: day === "SATURDAY" ? "22:00" : "21:00",
  isClosed: day === "SUNDAY",
}));

const initialForm = {
  name: "",
  description: "",
  imageUrl: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  phone: "",
  googleMapsUrl: "",
};

type SalonFormValues = typeof initialForm;

export default function CreateSalonPage() {
  const router = useRouter();
  const createSalonMutation = useCreateSalon();

  const {
    watch,
    setValue,
    handleSubmit: submitWithForm,
  } = useForm<SalonFormValues>({
    defaultValues: initialForm,
    mode: "onBlur",
  });

  const form = watch();

  const [services, setServices] = useState<ServiceDraft[]>([emptyService()]);
  const [hours, setHours] = useState<HoursDraft[]>(defaultHours);
  const [formError, setFormError] = useState("");

  function updateForm(field: keyof SalonFormValues, value: string) {
    setValue(field, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

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

  function isValidUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }

  function validateForm(): string | null {
    const requiredFields: (keyof SalonFormValues)[] = [
      "name",
      "address",
      "city",
      "state",
    ];

    for (const field of requiredFields) {
      if (!form[field].trim()) {
        const labels: Record<string, string> = {
          name: "Salon name",
          address: "Address",
          city: "City",
          state: "State",
        };

        return `${labels[field]} is required.`;
      }
    }

    if (form.name.trim().length > 150) {
      return "Salon name must be 150 characters or fewer.";
    }

    if (form.imageUrl.trim() && !isValidUrl(form.imageUrl)) {
      return "Enter a valid image URL.";
    }

    if (form.googleMapsUrl.trim() && !isValidUrl(form.googleMapsUrl)) {
      return "Enter a valid Google Maps URL.";
    }

    if (services.length === 0) {
      return "Add at least one service.";
    }

    for (let i = 0; i < services.length; i++) {
      const service = services[i];

      if (!service.name.trim()) {
        return `Enter a name for service ${i + 1}.`;
      }

      const duration = Number(service.durationMin);
      const price = Number(service.price);

      if (!Number.isInteger(duration) || duration <= 0) {
        return `Service ${i + 1} must have a positive whole-number duration.`;
      }

      if (!Number.isFinite(price) || price < 0 || service.price.trim() === "") {
        return `Enter a valid price for service ${i + 1}.`;
      }

      if (service.name.trim().length > 120) {
        return `Service ${i + 1} name must be 120 characters or fewer.`;
      }
    }

    for (const item of hours) {
      if (item.isClosed) continue;

      if (!item.opensAt || !item.closesAt) {
        return `Set opening and closing times for ${item.day.toLowerCase()}.`;
      }

      if (item.opensAt >= item.closesAt) {
        return `Closing time must be later than opening time on ${item.day.toLowerCase()}. Overnight opening hours are not supported by this form.`;
      }
    }

    return null;
  }

  async function handleSubmit() {
    setFormError("");

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload: CreateSalonInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      phone: form.phone.trim(),
      googleMapsUrl: form.googleMapsUrl.trim(),

      services: services.map((service): SalonServiceInput => ({
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
      await createSalonMutation.mutateAsync(payload);
      toast.success("Salon created successfully.");
      router.push("/owner/dashboard");
    } catch (error) {
      setFormError(getApiError(error));
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Back button */}
        <Link
          href="/owner/dashboard"
          className="mb-6 inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:h-11 sm:px-4"
        >
          <ArrowLeft className="size-4 shrink-0" />
          <span>Back to dashboard</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Create your salon
          </h1>
          <p className="mt-2 text-muted-foreground">
            Add your business details, services, and weekly opening hours.
          </p>
        </div>

        {formError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={submitWithForm(handleSubmit)} className="space-y-6">
          {/* Salon information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="size-5" />
                Salon information
              </CardTitle>
              <CardDescription>
                These details identify your business on Snipr.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Salon name *</Label>
                <Input
                  id="name"
                  maxLength={150}
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="Snipr Studio"
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="Describe your salon and what makes it special..."
                  rows={3}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="imageUrl">Salon image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => updateForm("imageUrl", e.target.value)}
                  placeholder="https://example.com/salon.jpg"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Street address *</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => updateForm("address", e.target.value)}
                  placeholder="123 CG Road"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => updateForm("city", e.target.value)}
                  placeholder="Ahmedabad"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(e) => updateForm("state", e.target.value)}
                  placeholder="Gujarat"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal code</Label>
                <Input
                  id="postalCode"
                  value={form.postalCode}
                  onChange={(e) => updateForm("postalCode", e.target.value)}
                  placeholder="380009"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Contact phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                  placeholder="+919876543210"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
                <Input
                  id="googleMapsUrl"
                  type="url"
                  value={form.googleMapsUrl}
                  onChange={(e) => updateForm("googleMapsUrl", e.target.value)}
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
                    Add the services customers can book at your salon.
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

          {/* Weekly opening hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5" />
                Weekly opening hours
              </CardTitle>
              <CardDescription>
                Set opening and closing times for every day. Mark a day closed
                when your salon does not operate.
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

          {/* Actions */}
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Button type="button" variant="outline">
              <Link href="/owner/dashboard">Cancel</Link>
            </Button>

            <Button
              type="submit"
              disabled={createSalonMutation.isPending}
              className="sm:min-w-44"
            >
              {createSalonMutation.isPending
                ? "Creating salon..."
                : "Create salon"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
