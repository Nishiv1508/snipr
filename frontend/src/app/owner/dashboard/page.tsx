"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, ChartNoAxesCombined, LogOut, Scissors, Settings2, Store, ArrowRight, Plus, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { getApiError } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { useMySalons } from "@/hooks/use-salons";

const ownerFeatures = [
  { icon: Scissors, title: "Services", description: "Set up the services and pricing your salon offers." },
  { icon: CalendarDays, title: "Appointments", description: "Manage availability and customer bookings." },
  { icon: ChartNoAxesCombined, title: "Business overview", description: "Review salon activity and performance as reporting becomes available." },
];
export default function OwnerDashboardPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const logout = useLogout();
  const user = currentUser.data;
  const salons = useMySalons();
  useEffect(() => { if (user && user.role !== "OWNER") router.replace("/customer/dashboard"); }, [user, router]);
  async function handleLogout() {
    try { await logout.mutateAsync(); toast.success("You have been logged out."); }
    catch (error) { toast.error(getApiError(error)); }
    finally { router.replace("/login"); router.refresh(); }
  }
  const isWrongRole = Boolean(user && user.role !== "OWNER");
  const salonError = salons.isError ? getApiError(salons.error) : "";
  return <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div><Badge variant="secondary" className="mb-3">Salon owner workspace</Badge><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welcome to your workspace.</h1>{currentUser.isPending ? <Skeleton className="mt-3 h-5 w-64" /> : <p className="mt-2 text-muted-foreground">{user ? user.email : "Manage your salons with Snipr."}</p>}</div>
        <div className="flex flex-wrap items-center gap-2"><Badge className="bg-violet-100 text-violet-800 hover:bg-violet-100 dark:bg-violet-900/40 dark:text-violet-300"><Settings2 className="mr-1 size-3" />Owner account</Badge><Button variant="outline" onClick={handleLogout} disabled={logout.isPending}><LogOut className="mr-2 size-4" />{logout.isPending ? "Logging out..." : "Log out"}</Button></div>
      </div>
      {currentUser.isError && <Alert variant="destructive" className="mt-6"><AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span>{getApiError(currentUser.error)}</span><Button variant="outline" asChild size="sm"><Link href="/login">Sign in again</Link></Button></AlertDescription></Alert>}
      {isWrongRole ? <Card className="mt-10"><CardContent className="p-6"><Skeleton className="h-5 w-48" /><p className="mt-3 text-sm text-muted-foreground">Redirecting you to the correct dashboard…</p></CardContent></Card> : <>
        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-semibold">Your salons</h2><p className="mt-1 text-sm text-muted-foreground">Register and manage multiple salon locations from one account.</p></div><Button asChild className="bg-violet-700 hover:bg-violet-800"><Link href="/owner/salons/new"><Plus className="mr-2 size-4" />Register a salon</Link></Button></div>
          {salonError && <Alert variant="destructive" className="mb-4"><AlertDescription>{salonError}</AlertDescription></Alert>}
          {salons.isPending ? <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-44" /><Skeleton className="h-44" /></div> : salons.data?.length ? <div className="grid gap-4 md:grid-cols-2">
            {salons.data.map((salon) => <Card key={salon.id}>
              <CardHeader><CardTitle className="flex items-center gap-2"><Store className="size-5 text-violet-700" />{salon.name}</CardTitle><CardDescription>{salon.description || "No description added yet."}</CardDescription></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground"><p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" /><span>{salon.addressLine1}{salon.addressLine2 ? ", " + salon.addressLine2 : ""}, {salon.city}, {salon.state} {salon.postalCode}, {salon.country}</span></p><p className="flex items-center gap-2"><Phone className="size-4 shrink-0" />{salon.phone}</p><Badge variant="outline">Registered {new Date(salon.createdAt).toLocaleDateString()}</Badge></CardContent>
            </Card>)}
          </div> : <Card><CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center"><div className="flex size-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Store className="size-6" /></div><div className="flex-1"><h3 className="font-semibold">Your first salon starts here</h3><p className="mt-1 text-sm text-muted-foreground">Add the salon name, contact details, and location to get started.</p></div><Button asChild><Link href="/owner/salons/new">Register your first salon<ArrowRight className="ml-2 size-4" /></Link></Button></CardContent></Card>}
        </section>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{ownerFeatures.map(({ icon: Icon, title, description }) => <Card key={title} className="transition-shadow hover:shadow-md"><CardHeader><div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"><Icon className="size-6" /></div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent><Badge variant="outline">Coming soon</Badge></CardContent></Card>)}</div>
        <Card className="mt-6"><CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center"><div className="flex-1"><h2 className="font-semibold">Grow your salon business with Snipr</h2><p className="mt-1 text-sm text-muted-foreground">Services, appointments, and reporting can be built on top of your registered salons.</p></div><Button variant="outline" asChild><Link href="/">View public website</Link></Button></CardContent></Card>
      </>}
    </main>
    <Footer />
  </div>;
}
