"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Scissors,
  Search,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { getApiError } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";

export default function CustomerDashboardPage() {
  const router = useRouter();

  const currentUser = useCurrentUser();
  const logout = useLogout();

  const user = currentUser.data;
  const loading = currentUser.isPending;
  const error = currentUser.isError ? getApiError(currentUser.error) : "";

  async function handleLogout() {
    try {
      await logout.mutateAsync();
      toast.success("You have been logged out.");
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      router.replace("/login");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <Badge variant="secondary" className="mb-3">
              Customer space
            </Badge>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Your time, your style.
            </h1>

            {loading ? (
              <Skeleton className="mt-3 h-5 w-56" />
            ) : (
              <p className="mt-2 text-muted-foreground">
                {user ? `Welcome back, ${user.email}.` : "Your Snipr account"}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <LogOut className="mr-2 size-4" />
            {logout.isPending ? "Logging out..." : "Log out"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm">
                <Link href="/login">Sign in again</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Card className="overflow-hidden border-violet-200 bg-violet-50/60 dark:border-violet-900 dark:bg-violet-950/20">
            <CardHeader>
              <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                <Search className="size-6" />
              </div>

              <CardTitle>Find your next salon</CardTitle>
              <CardDescription>
                Discover salons and services for your next visit.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Button className="bg-violet-700 text-white hover:bg-violet-800">
                <Link href="/#discover">Explore Snipr</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-secondary text-foreground">
                <CalendarDays className="size-6" />
              </div>

              <CardTitle>Your appointments</CardTitle>
              <CardDescription>
                Keep track of your upcoming and past salon bookings in one
                place. Appointment management will appear here when booking
                functionality is connected.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Badge variant="outline">Booking integration pending</Badge>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-5">
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
              <Scissors className="size-6" />
            </div>

            <div className="flex-1">
              <h2 className="font-semibold">A little time for yourself</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Snipr brings your salon discovery and booking experience into
                one place.
              </p>
            </div>

            <Button variant="outline">
              <Link href="/">Explore the platform</Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
