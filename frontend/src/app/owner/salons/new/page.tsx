"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Store } from "lucide-react";
import { toast } from "sonner";
import { getApiError } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCurrentUser } from "@/hooks/use-auth";
import { useCreateSalon } from "@/hooks/use-salons";

const schema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(120),
  phone: z.string().trim().min(7, "Enter a valid phone number.").max(20).regex(/^[+()\\d\\s.-]+$/, "Enter a valid phone number."),
  description: z.string().trim().max(1000).optional(),
  addressLine1: z.string().trim().min(3, "Enter the street address.").max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(12).regex(/^[a-zA-Z0-9 -]+$/, "Enter a valid postal code."),
  country: z.string().trim().min(2).max(80),
});
type FormValues = z.infer<typeof schema>;
const fields: { name: "name" | "phone" | "addressLine1" | "addressLine2" | "city" | "state" | "postalCode" | "country"; label: string; placeholder: string }[] = [
  { name: "name", label: "Salon name", placeholder: "e.g. The Style Studio" },
  { name: "phone", label: "Contact phone", placeholder: "+91 98765 43210" },
  { name: "addressLine1", label: "Address line 1", placeholder: "Building, street, area" },
  { name: "addressLine2", label: "Address line 2 (optional)", placeholder: "Landmark, suite, floor" },
  { name: "city", label: "City", placeholder: "Ahmedabad" },
  { name: "state", label: "State", placeholder: "Gujarat" },
  { name: "postalCode", label: "Postal code", placeholder: "380001" },
  { name: "country", label: "Country", placeholder: "India" },
];
export default function NewSalonPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const createSalonMutation = useCreateSalon();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", description: "", addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "", country: "India" },
    mode: "onBlur",
  });
  async function onSubmit(values: FormValues) {
    setServerError("");
    try {
      await createSalonMutation.mutateAsync({
        ...values,
        description: values.description?.trim() || undefined,
        addressLine2: values.addressLine2?.trim() || undefined,
      });
      toast.success("Your salon has been registered.");
      router.replace("/owner/dashboard");
    } catch (error) {
      const message = getApiError(error);
      setServerError(message);
      toast.error(message);
    }
  }
  const busy = isSubmitting || createSalonMutation.isPending;
  const user = currentUser.data;
  if (currentUser.isPending) return <div className="min-h-screen"><Navbar /><main className="mx-auto max-w-3xl px-5 py-12 text-sm text-muted-foreground">Checking your owner account…</main><Footer /></div>;
  if (user && user.role !== "OWNER") return <div className="min-h-screen"><Navbar /><main className="mx-auto max-w-3xl px-5 py-12"><Alert variant="destructive"><AlertDescription>Only salon owner accounts can register a salon.</AlertDescription></Alert><Button asChild className="mt-4"><Link href="/customer/dashboard">Go to your dashboard</Link></Button></main><Footer /></div>;
  return <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Button variant="ghost" asChild className="mb-5 -ml-3"><Link href="/owner/dashboard"><ArrowLeft className="mr-2 size-4" />Back to dashboard</Link></Button>
      <Card className="border-stone-200/80 shadow-sm">
        <CardHeader className="space-y-3"><div className="flex size-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Store className="size-6" /></div><CardTitle className="text-2xl">Register your salon</CardTitle><CardDescription>Add your salon’s contact and address details. You can register more than one salon under this owner account.</CardDescription></CardHeader>
        <CardContent><form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {serverError && <Alert variant="destructive"><AlertDescription>{serverError}</AlertDescription></Alert>}
          <div className="grid gap-5 sm:grid-cols-2">
            {fields.map(({ name, label, placeholder }) => <div key={name} className={name === "addressLine1" || name === "addressLine2" ? "space-y-2 sm:col-span-2" : "space-y-2"}>
              <Label htmlFor={name}>{label}</Label><Input id={name} placeholder={placeholder} aria-invalid={!!errors[name]} {...register(name)} />
              {errors[name] && <p role="alert" className="text-sm text-destructive">{errors[name]?.message}</p>}
            </div>)}
          </div>
          <div className="space-y-2"><Label htmlFor="description">About the salon (optional)</Label><Textarea id="description" rows={4} maxLength={1000} placeholder="Tell customers what makes your salon special." aria-invalid={!!errors.description} {...register("description")} />{errors.description && <p role="alert" className="text-sm text-destructive">{errors.description.message}</p>}</div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" asChild><Link href="/owner/dashboard">Cancel</Link></Button><Button type="submit" disabled={busy} className="bg-violet-700 hover:bg-violet-800">{busy ? "Registering salon…" : "Register salon"}</Button></div>
        </form></CardContent>
      </Card>
    </main>
    <Footer />
  </div>;
}
