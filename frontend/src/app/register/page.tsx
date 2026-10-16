import RegisterationForm from "@/components/auth/RegistrationForm";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterationForm />
    </Suspense>
  );
}
