"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Scissors, Store, Globe } from "lucide-react";
import { toast } from "sonner";

import { getApiError } from "@/lib/api";
import { useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function OwnerNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();

  const links = [{ href: "/owner/dashboard", label: "Dashboard", icon: Store }];

  async function handleLogout() {
    try {
      await logout.mutateAsync();
      toast.success("You have been logged out.");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/owner/dashboard"
          className="flex shrink-0 items-center gap-2"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-violet-600 text-white">
            <Scissors className="size-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">snipr</span>
          <span className="hidden rounded-md bg-muted px-2 py-1 text-xs font-medium sm:inline">
            Owner
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="mr-2 size-4" />
                {label}
              </Link>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <LogOut className="mr-2 size-4" />
            <span className="hidden sm:inline">
              {logout.isPending ? "Logging out..." : "Logout"}
            </span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
