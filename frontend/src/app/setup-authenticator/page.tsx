"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useSetupTwoFactor, useEnableTwoFactor } from "@/hooks/use-auth";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function SetupAuthenticatorPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");

  const setupMutation = useSetupTwoFactor();
  const enableMutation = useEnableTwoFactor();

  const setup = setupMutation.data ?? null;
  const recoveryCodes = enableMutation.data?.recoveryCodes ?? [];

  const error =
    localError ||
    (setupMutation.isError
      ? getApiError(setupMutation.error)
      : enableMutation.isError
        ? getApiError(enableMutation.error)
        : "");

  function handleSetup() {
    setLocalError("");
    setupMutation.mutate();
  }

  async function handleEnable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");

    try {
      await enableMutation.mutateAsync(code);
      toast.success("Authenticator enabled successfully.");
    } catch {
      // The mutation error is displayed through the Alert below.
    }
  }

  async function copyRecoveryCodes() {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      toast.success("Recovery codes copied.");
    } catch {
      setLocalError(
        "Unable to copy recovery codes. Please copy them manually.",
      );
    }
  }

  // Show recovery codes only after the server successfully enables 2FA.
  if (recoveryCodes.length > 0) {
    return (
      <AuthLayout eyebrow="SECURE YOUR OWNER ACCOUNT">
        <Card className="border-stone-200/80 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <ShieldCheck className="size-6" />
            </div>

            <CardTitle className="text-2xl">Save your recovery codes</CardTitle>

            <CardDescription>
              Each code can be used once if you lose access to your
              authenticator. Save these somewhere secure before continuing.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <Alert>
              <AlertDescription>
                These codes are displayed only during setup. Store them securely
                and never share them with anyone.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/40 p-4">
              {recoveryCodes.map((recoveryCode) => (
                <code
                  key={recoveryCode}
                  className="rounded-md bg-background p-2 text-center text-sm"
                >
                  {recoveryCode}
                </code>
              ))}
            </div>

            {localError && (
              <Alert variant="destructive">
                <AlertDescription>{localError}</AlertDescription>
              </Alert>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={copyRecoveryCodes}
            >
              <Copy className="mr-2 size-4" />
              Copy recovery codes
            </Button>

            <Button
              type="button"
              className="w-full bg-violet-700 hover:bg-violet-800"
              onClick={() => router.replace("/owner/dashboard")}
            >
              Continue to dashboard
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="OWNER ACCOUNT SECURITY">
      <Card className="border-stone-200/80 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <ShieldCheck className="size-6" />
          </div>

          <CardTitle className="text-2xl">Set up your authenticator</CardTitle>

          <CardDescription>
            Protect your salon owner account with two-factor authentication
            using Microsoft Authenticator or another compatible app.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!setup && !setupMutation.isPending && (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Generate a QR code to link your Snipr owner account to your
                authenticator app.
              </p>

              <Button
                type="button"
                className="w-full bg-violet-700 hover:bg-violet-800"
                onClick={handleSetup}
              >
                Generate authenticator QR code
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => router.replace("/login")}
              >
                Return to login
              </Button>
            </div>
          )}

          {setupMutation.isPending && (
            <div className="space-y-4">
              <Skeleton className="mx-auto size-48 rounded-xl" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <p className="text-center text-sm text-muted-foreground">
                Generating your authenticator setup...
              </p>
            </div>
          )}

          {setup && (
            <>
              <div className="flex justify-center rounded-xl border bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={setup.qrCodeDataUrl}
                  alt="QR code for setting up Snipr two-factor authentication"
                  width={200}
                  height={200}
                  className="size-48"
                />
              </div>

              <p className="text-center text-sm leading-6 text-muted-foreground">
                Open your authenticator app, add an account, and scan this QR
                code.
              </p>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="manualSecret">Set up manually instead</Label>

                <Input
                  id="manualSecret"
                  value={setup.secret}
                  readOnly
                  autoComplete="off"
                />

                <p className="text-xs leading-5 text-muted-foreground">
                  Enter this key manually if you cannot scan the QR code. Keep
                  it private.
                </p>
              </div>

              <form onSubmit={handleEnable} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Six-digit verification code</Label>

                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(event) => {
                      setCode(
                        event.target.value.replace(/\D/g, "").slice(0, 6),
                      );
                      setLocalError("");
                    }}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={enableMutation.isPending || code.length !== 6}
                  className="w-full bg-violet-700 hover:bg-violet-800"
                >
                  {enableMutation.isPending
                    ? "Verifying..."
                    : "Verify and enable"}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
