"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scissors, LogOut } from "lucide-react";

import { useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function CustomerNavbar() {
  const router = useRouter();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        router.push("/login");
      },
    });
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/customer/salons" className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scissors className="size-5" />
          </div>

          <span className="text-lg font-semibold tracking-tight">Snipr</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/customer/salons"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Explore salons
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={logout.isPending}
            className="flex items-center gap-2"
          >
            <LogOut className="size-4" />
            {logout.isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </nav>
  );
}
