import type { ReactNode } from "react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Footer } from "@/components/footer";
import CustomerNavbar from "@/components/customers/CustomerNavbar";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRole="CUSTOMER">
      <CustomerNavbar />
      {children}
      <Footer />
    </ProtectedRoute>
  );
}
