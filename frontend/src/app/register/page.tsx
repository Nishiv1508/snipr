"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Scissors, UserRound, Store } from "lucide-react";
import { toast } from "sonner";

import { getApiError } from "@/lib/api";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRegister } from "@/hooks/use-auth";
import { Eye, EyeOff } from "lucide-react";

const registerSchema = z
  .object({
    role: z.enum(["CUSTOMER", "OWNER"]),
    email: z
      .string()
      .trim()
      .min(1, "Email address is required.")
      .email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const register = useRegister();

  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: searchParams.get("role") === "OWNER" ? "OWNER" : "CUSTOMER",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const selectedRole = watch("role");

  async function onSubmit(values: RegisterFormValues) {
    setServerError("");

    try {
      const result = await register.mutateAsync({
        email: values.email,
        password: values.password,
        role: values.role,
      });

      toast.success("Account created successfully.");

      if (
        result.setupRequired ||
        result.twoFactorRequired ||
        values.role === "OWNER"
      ) {
        router.replace("/setup-authenticator");
      } else {
        router.replace("/customer/dashboard");
      }
    } catch (error) {
      const message = getApiError(error);
      setServerError(message);

      // Map common backend validation errors to the relevant field.
      if (
        /email/i.test(message) &&
        /already|exist|registered|invalid/i.test(message)
      ) {
        setError("email", { type: "server", message });
      }
    }
  }

  const busy = isSubmitting || register.isPending;

  return (
    <AuthLayout>
      <Card className="border-stone-200/80 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <Scissors className="size-6" />
          </div>

          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Join Snipr and make your next salon experience simpler.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-5"
          >
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label> I want to join Snipr as a </Label>

              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid grid-cols-2 gap-3"
                    aria-label="Account type"
                  >
                    <Label
                      htmlFor="customer"
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${
                        selectedRole === "CUSTOMER"
                          ? "border-violet-500 bg-violet-50"
                          : "border-stone-200"
                      }`}
                    >
                      <RadioGroupItem
                        value="CUSTOMER"
                        id="customer"
                        className="mt-1"
                      />
                      <span>
                        <UserRound className="mb-2 size-5 text-violet-700" />
                        <span className="block font-semibold">Customer</span>
                        <span className="mt-1 block text-xs font-normal text-muted-foreground">
                          Discover salons
                        </span>
                      </span>
                    </Label>

                    <Label
                      htmlFor="owner"
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${
                        selectedRole === "OWNER"
                          ? "border-violet-500 bg-violet-50"
                          : "border-stone-200"
                      }`}
                    >
                      <RadioGroupItem
                        value="OWNER"
                        id="owner"
                        className="mt-1"
                      />
                      <span>
                        <Store className="mb-2 size-5 text-violet-700" />
                        <span className="block font-semibold">Salon owner</span>
                        <span className="mt-1 block text-xs font-normal text-muted-foreground">
                          Manage a salon
                        </span>
                      </span>
                    </Label>
                  </RadioGroup>
                )}
              />

              {errors.role && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.role.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                {...registerField("email")}
              />
              {errors.email && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  aria-invalid={!!errors.password}
                  className="pr-10"
                  {...registerField("password")}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>

              {errors.password && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>

              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  className="pr-10"
                  {...registerField("confirmPassword")}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:bg-transparent"
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>

              {errors.confirmPassword && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {selectedRole === "OWNER" && (
              <Alert>
                <AlertDescription>
                  Salon owner accounts must enable authenticator-based
                  two-factor authentication before accessing the dashboard.
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-violet-700 hover:bg-violet-800"
            >
              {busy ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-violet-700 hover:underline"
            >
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
