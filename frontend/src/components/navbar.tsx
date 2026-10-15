"use client";

import Link from "next/link";
import { ArrowUpRight, Menu, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { label: "Discover", href: "/#discover" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "For salons", href: "/#for-salons" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-background/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="Snipr home"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-violet-700 text-white">
            <Scissors className="size-5" />
          </span>
          <span className="text-2xl font-semibold tracking-tight">
            snipr<span className="text-violet-700">.</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost">
            <Link href="/login">Log in</Link>
          </Button>
          <Button className="rounded-full bg-violet-700 hover:bg-violet-800">
            <Link href="/register">Get started</Link>
          </Button>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger
              aria-label="Open navigation"
              className="inline-flex size-10 items-center justify-center rounded-md border border-stone-300 bg-background transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-75">
              <SheetHeader className="text-left">
                <SheetTitle className="text-xl">
                  snipr<span className="text-violet-700">.</span>
                </SheetTitle>
                <SheetDescription>
                  Your next great salon experience starts here.
                </SheetDescription>
              </SheetHeader>
              <Separator className="my-5" />
              <div className="flex flex-col gap-2">
                {links.map((link) => (
                  <Button
                    key={link.href}
                    variant="ghost"
                    className="justify-start"
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
                <Separator className="my-3" />
                <Button variant="outline">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button className="bg-violet-700 hover:bg-violet-800">
                  <Link href="/register">Get started</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
