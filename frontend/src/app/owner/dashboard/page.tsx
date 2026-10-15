"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, RefreshCw, Store } from "lucide-react";

import { getApiError } from "@/lib/api";
import { OwnerNavbar } from "@/components/owner/navbar";
import { SalonCard } from "@/components/owner/salon-card";
import { useCurrentUser } from "@/hooks/use-auth";
import { useMySalons } from "@/hooks/use-salons";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function OwnerDashboardPage() {
  const router = useRouter();

  const currentUser = useCurrentUser();
  const salonsQuery = useMySalons();

  const user = currentUser.data;
  const salons = salonsQuery.data ?? [];

  const isWrongRole = Boolean(user && user.role !== "OWNER");

  useEffect(() => {
    if (user && user.role !== "OWNER") {
      router.replace("/customer/dashboard");
    }
  }, [user, router]);

  const stats = [
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

  return (
    <div className="min-h-screen bg-muted/20">
      <OwnerNavbar />

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        {isWrongRole ? (
          <Card>
            <CardContent className="p-6">
              Redirecting you to the correct dashboard...
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Dashboard heading and actions */}
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

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => salonsQuery.refetch()}
                  disabled={salonsQuery.isFetching}
                >
                  <RefreshCw
                    className={`mr-2 size-4 ${
                      salonsQuery.isFetching ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>

                <Button>
                  <Link href="/owner/salons/new">Create salon</Link>
                </Button>
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
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
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

            {/* Loading skeletons */}
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

            {/* Empty state */}
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

                  <Button className="mt-6">
                    <Link href="/owner/salons/new">Get started</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Reusable salon cards */}
            {salonsQuery.isSuccess && salons.length > 0 && (
              <section className="mt-8">
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
