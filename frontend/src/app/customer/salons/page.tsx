"use client";

import { Store } from "lucide-react";

import { usePublicSalons } from "@/hooks/use-salons";
import { getApiError } from "@/lib/api";

import CustomerNavbar from "@/components/customers/CustomerNavbar";
import SalonCard from "@/components/customers/SalonCard";

import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Footer } from "@/components/footer";

export default function CustomerSalonsPage() {
  const salonsQuery = usePublicSalons();
  const salons = salonsQuery.data ?? [];

  return (
    <main className="min-h-screen bg-muted/20">
      <CustomerNavbar />

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <header className="mb-8">
          <p className="mb-2 text-sm font-medium text-primary">
            FIND YOUR NEXT APPOINTMENT
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Explore salons
          </h1>

          <p className="mt-2 max-w-2xl text-muted-foreground">
            Discover salons around you, explore their services, and check their
            opening hours before you visit.
          </p>
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

              <h2 className="text-xl font-semibold">No salons available yet</h2>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Published salons will appear here when they become available.
              </p>
            </CardContent>
          </Card>
        )}

        {salonsQuery.isSuccess && salons.length > 0 && (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {salons.length} salon{salons.length === 1 ? "" : "s"} available
            </p>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {salons.map((salon) => (
                <SalonCard key={salon.id} salon={salon} />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
