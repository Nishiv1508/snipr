"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Scissors, LogOut } from "lucide-react";

import { useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function CustomerNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        router.push("/login");
      },
    });
  };

  const isBookingsPage = pathname === "/customer/bookings";

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/90 shadow-sm shadow-black/[0.02] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <Link
          href="/customer/salons"
          className="flex shrink-0 items-center gap-2"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-violet-900/15">
            <Scissors className="size-5" />
          </div>

          <span className="text-lg font-semibold tracking-tight">Snipr</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-3">
          <Button variant="ghost" size="sm" className="gap-2">
            <Link href="/customer/salons">
              <span className="hidden sm:inline">Explore salons</span>
              <span className="sm:hidden">Explore</span>
            </Link>
          </Button>

          <Button
            variant={isBookingsPage ? "secondary" : "ghost"}
            size="sm"
            className="gap-2"
          >
            <Link
              href="/customer/bookings"
              aria-label="My bookings"
              aria-current={isBookingsPage ? "page" : undefined}
            >
              <span className="sm:hidden">Bookings</span>
              <span className="hidden sm:inline">My Bookings</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={logout.isPending}
            className="gap-2"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">
              {logout.isPending ? "Logging out..." : "Logout"}
            </span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
