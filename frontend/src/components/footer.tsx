import Link from "next/link";
import { Scissors } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Scissors className="size-4 text-violet-700" />
          snipr<span className="text-violet-700">.</span>
        </Link>
        <Separator className="sm:hidden" />
        <p className="text-sm text-muted-foreground">
          Find your style. Book your time.
        </p>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Snipr
        </p>
      </div>
    </footer>
  );
}
