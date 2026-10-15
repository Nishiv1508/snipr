import Image from "next/image";
import Link from "next/link";
import {
  CalendarCheck,
  Check,
  Clock3,
  MapPin,
  Scissors,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: MapPin,
    title: "Find your place",
    description: "Discover salons and stylists that match your style.",
  },
  {
    icon: CalendarCheck,
    title: "Book with ease",
    description: "Choose a service and find a time that works for you.",
  },
  {
    icon: ShieldCheck,
    title: "Stay in control",
    description: "Keep your appointments organized in one place.",
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 md:py-24 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-2xl">
            <Badge
              variant="secondary"
              className="mb-6 rounded-full px-4 py-1.5"
            >
              <Sparkles className="mr-2 size-3.5 text-violet-700" />A better way
              to book beauty
            </Badge>

            <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              Good hair days
              <br />
              <span className="font-serif italic text-violet-700">
                start here.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              Your next favourite salon is closer than you think. Discover
              services, find your stylist, and make time for yourself.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-full bg-violet-700 px-6 hover:bg-violet-800"
              >
                <Link href="/register">Find your salon</Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-6">
                <Link href="#how-it-works">How it works</Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Check className="size-4 text-violet-700" /> Easy booking
              </span>
              <span className="flex items-center gap-2">
                <Check className="size-4 text-violet-700" /> Your schedule
              </span>
              <span className="flex items-center gap-2">
                <Check className="size-4 text-violet-700" /> Less hassle
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-4 -top-4 size-28 rounded-full bg-violet-200/60 blur-3xl" />
            <div className="relative aspect-4/5 overflow-hidden rounded-4xl bg-stone-200 sm:aspect-5/4 lg:aspect-4/5">
              <Image
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85"
                alt="Contemporary salon interior"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-stone-950/65 via-transparent to-transparent" />

              <Card className="absolute bottom-5 left-5 right-5 border-white/30 bg-white/95 shadow-xl sm:bottom-7 sm:left-7 sm:right-7">
                <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <Scissors className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">Your next appointment</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      A little time just for you.
                    </p>
                  </div>
                  <Clock3 className="size-5 shrink-0 text-violet-700" />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="discover" className="border-y border-stone-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold tracking-[0.2em] text-violet-700">
                YOUR SELF-CARE, SIMPLIFIED
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Make room for feeling your best.
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                From discovering a new salon to keeping track of your plans,
                Snipr makes the experience simpler.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description }, index) => (
                <Card key={title} className="border-stone-200/80 shadow-sm">
                  <CardHeader>
                    <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                      <Icon className="size-5" />
                    </div>
                    <Badge variant="outline" className="w-fit">
                      0{index + 1}
                    </Badge>
                    <CardTitle className="pt-2 text-xl">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-7 text-muted-foreground">
                      {description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto max-w-7xl px-5 py-20 sm:px-8"
        >
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-violet-700">
                THREE SIMPLE STEPS
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Your next appointment, without the back and forth.
              </h2>
              <div className="mt-8 space-y-6">
                {[
                  [
                    "01",
                    "Create your account",
                    "Set up your personal Snipr account.",
                  ],
                  [
                    "02",
                    "Explore your options",
                    "Discover available salons and services.",
                  ],
                  [
                    "03",
                    "Make time for yourself",
                    "Continue to booking as the platform's features become available.",
                  ],
                ].map(([number, title, description]) => (
                  <div key={number} className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
                      {number}
                    </div>
                    <div>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-80 overflow-hidden rounded-4xl bg-stone-200 md:min-h-115">
              <Image
                src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=85"
                alt="Stylist working in a salon"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <section id="for-salons" className="px-5 pb-20 sm:px-8">
          <Card className="mx-auto max-w-7xl overflow-hidden border-0 bg-violet-950 text-white shadow-xl">
            <CardContent className="grid items-center gap-8 p-8 sm:p-12 md:grid-cols-[1fr_auto] md:p-16">
              <div>
                <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                  For salon owners
                </Badge>
                <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  Your salon deserves a better way to grow.
                </h2>
                <p className="mt-4 max-w-xl leading-7 text-violet-100/80">
                  Create an owner account and explore the salon management
                  experience Snipr is building.
                </p>
              </div>
              <Button size="lg" variant="secondary" className="rounded-full">
                <Link href="/register?role=OWNER">Join as an owner</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </>
  );
}
