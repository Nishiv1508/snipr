"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Store } from "lucide-react";

import { usePublicSalons } from "@/hooks/use-salons";
import { getApiError } from "@/lib/api";
import type { SalonCity } from "@/lib/api/salon.api";

import SalonCard from "@/components/customers/SalonCard";

import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

const SUPPORTED_CITIES: {
  label: string;
  value: SalonCity;
  latitude: number;
  longitude: number;
}[] = [
  {
    label: "Ahmedabad",
    value: "Ahmedabad",
    latitude: 23.0225,
    longitude: 72.5714,
  },
  { label: "Mumbai", value: "Mumbai", latitude: 19.076, longitude: 72.8777 },
  {
    label: "Bangalore",
    value: "Bangalore",
    latitude: 12.9716,
    longitude: 77.5946,
  },
];

function getNearestSupportedCity(
  latitude: number,
  longitude: number,
): SalonCity {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const distance = (city: (typeof SUPPORTED_CITIES)[number]) => {
    const lat1 = toRadians(latitude);
    const lat2 = toRadians(city.latitude);
    const deltaLat = toRadians(city.latitude - latitude);
    const deltaLon = toRadians(city.longitude - longitude);
    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  return [...SUPPORTED_CITIES].sort((a, b) => distance(a) - distance(b))[0]
    .value;
}

export default function CustomerSalonsPage() {
  const [city, setCity] = useState<SalonCity>("Ahmedabad");
  const [locationMessage, setLocationMessage] = useState(
    "Allow location access to choose the closest supported city automatically.",
  );
  const manuallySelectedCity = useRef(false);
  const salonsQuery = usePublicSalons(city);
  const salons = salonsQuery.data ?? [];

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationMessage(
        "Location access is not supported by this browser. Choose a city below.",
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (manuallySelectedCity.current) return;
        const detectedCity = getNearestSupportedCity(
          position.coords.latitude,
          position.coords.longitude,
        );
        setCity(detectedCity);
        setLocationMessage(
          `Showing salons in ${detectedCity}, based on your location.`,
        );
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationMessage(
            "Location permission was not granted. Ahmedabad is selected by default; you can choose another city.",
          );
        } else {
          setLocationMessage(
            "Couldn't determine your location. Ahmedabad is selected by default; you can choose another city.",
          );
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  function handleCityChange(value: string) {
    const selectedCity = SUPPORTED_CITIES.find((item) => item.value === value);
    if (!selectedCity) return;
    manuallySelectedCity.current = true;
    setCity(selectedCity.value);
    setLocationMessage(`Showing salons in ${selectedCity.value}.`);
  }

  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">
              FIND YOUR NEXT APPOINTMENT
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Explore salons
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Discover salons near your selected city, explore their services,
              and check their opening hours before you visit.
            </p>
          </div>

          <div className="w-full space-y-2 md:max-w-xs">
            <Label htmlFor="salon-city" className="flex items-center gap-2">
              <MapPin className="size-4" /> Salon location
            </Label>
            <select
              id="salon-city"
              value={city}
              onChange={(event) => handleCityChange(event.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SUPPORTED_CITIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {locationMessage}
            </p>
          </div>
        </header>

        {salonsQuery.isError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{getApiError(salonsQuery.error)}</span>
              <button
                type="button"
                onClick={() => salonsQuery.refetch()}
                className="text-left text-sm font-medium underline underline-offset-4"
              >
                Try again
              </button>
            </AlertDescription>
          </Alert>
        )}

        {salonsQuery.isPending && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Card key={item} className="overflow-hidden">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardContent className="space-y-4 p-5">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {salonsQuery.isSuccess && salons.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                <Store className="size-8" />
              </div>
              <h2 className="text-xl font-semibold">No salons in {city}</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                There are no published salons in this city yet. Try selecting
                another location.
              </p>
            </CardContent>
          </Card>
        )}

        {salonsQuery.isSuccess && salons.length > 0 && (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {salons.length} salon{salons.length === 1 ? "" : "s"} available in{" "}
              {city}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {salons.map((salon) => (
                <SalonCard key={salon.id} salon={salon} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
