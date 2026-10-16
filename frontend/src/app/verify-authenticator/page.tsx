"use client";

import { useState } from "react";
import { useVerifyLoginTwoFactor } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { api, getApiError } from "@/lib/api";
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
import { Separator } from "@/components/ui/separator";

export default function VerifyAuthenticatorPage() {
  const router = useRouter();
  const [useRecovery, setUseRecovery] = useState(false);
  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyLogin = useVerifyLoginTwoFactor();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await verifyLogin.mutateAsync(useRecovery ? { recoveryCode } : { code });

      router.replace("/owner/dashboard");
    } catch (err) {
      setError(getApiError(err));
    }
  }

  return (
    <AuthLayout eyebrow="OWNER ACCOUNT SECURITY">
      <Card>
        <CardHeader>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <ShieldCheck className="size-6" />
          </div>
          <CardTitle>Verify it's you</CardTitle>
          <CardDescription>
            Enter a code from your authenticator to continue to your Snipr owner
            account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!useRecovery ? (
              <div className="space-y-2">
                <Label htmlFor="code">Authenticator code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="recoveryCode">Recovery code</Label>
                <Input
                  id="recoveryCode"
                  autoComplete="off"
                  placeholder="XXXX-XXXX-XXXX"
                  value={recoveryCode}
                  onChange={(event) => setRecoveryCode(event.target.value)}
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={
                verifyLogin.isPending ||
                (!useRecovery && code.length !== 6) ||
                (useRecovery && !recoveryCode.trim())
              }
              className="w-full bg-violet-700 hover:bg-violet-800"
            >
              {verifyLogin.isPending ? "Verifying..." : "Verify and continue"}
            </Button>
          </form>

          <Separator />

          <div className="text-center">
            <Button
              variant="link"
              type="button"
              onClick={() => {
                setUseRecovery((current) => !current);
                setCode("");
                setRecoveryCode("");
                setError("");
              }}
            >
              {useRecovery
                ? "Use authenticator code instead"
                : "Use a recovery code instead"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
