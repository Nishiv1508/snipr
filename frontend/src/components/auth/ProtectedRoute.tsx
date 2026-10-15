"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useCurrentUser } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

type UserRole = "OWNER" | "CUSTOMER" | "ADMIN";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole: "OWNER" | "CUSTOMER";
}

export default function ProtectedRoute({
  children,
  allowedRole,
}: ProtectedRouteProps) {
  const router = useRouter();

  const { data: user, isPending, isError } = useCurrentUser();

  const isAuthorized = user?.role === allowedRole;

  useEffect(() => {
    if (isPending) return;

    if (isError || !user) {
      router.replace("/login");
      return;
    }

    if (!isAuthorized) {
      const roleRedirects: Record<UserRole, string> = {
        OWNER: "/owner/dashboard",
        CUSTOMER: "/customer/dashboard",
        ADMIN: "/login",
      };

      router.replace(roleRedirects[user.role as UserRole] ?? "/login");
    }
  }, [isPending, isError, user, isAuthorized, router]);

  if (isPending || isError || !isAuthorized) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-5 py-12">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
