import Link from "next/link";
import { Scissors } from "lucide-react";
import { Footer } from "@/components/footer";

export function AuthLayout({
  children,
  eyebrow = "THE SALON EXPERIENCE, REIMAGINED",
}: {
  children: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-stone-200/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-xl"
          >
            <Scissors className="size-5 text-violet-700" />
            snipr<span className="text-violet-700">.</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <p className="mb-3 text-center text-xs font-semibold tracking-[0.2em] text-violet-700">
            {eyebrow}
          </p>
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
