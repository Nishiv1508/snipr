import type { ReactNode } from "react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { OwnerNavbar } from "@/components/owner/navbar";
import { Footer } from "@/components/footer";

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRole="OWNER">
      <OwnerNavbar />
      {children}
      <Footer />
    </ProtectedRoute>
  );
}
