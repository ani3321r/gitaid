import Link from "next/link";
import {
  ArrowRight,
  Code2,
  MessageSquare,
  Sparkles,
} from "lucide-react";

import { BrandMark } from "@/components/layout/app-shell";
import { GitAidIcon } from "@/components/icons/gitaid-icon";
import { GitHubIcon } from "@/components/icons/github-icon";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: GitHubIcon,
    title: "Connect GitHub",
    description:
      "OAuth with repo scope for public and private repositories.",
  },
  {
    icon: Sparkles,
    title: "Index with RAG",
    description:
      "Chunk and embed your code into Postgres + pgvector.",
  },
  {
    icon: MessageSquare,
    title: "Ask anything",
    description:
      "Get grounded answers with clickable citations.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background">

      {/* Background glow */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          "bg-[radial-gradient(ellipse_at_top,oklch(from_var(--primary)_l_c_h/0.12),transparent_55%)]"
        )}
      />

      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-0",
          "-translate-x-1/2",
          "h-[500px] w-[700px]",
          "rounded-full bg-primary/5 blur-3xl"
        )}
      />


      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="relative z-10 mx-auto flex h-16 max-w-5xl items-center justify-between px-5">

        <Link
          href="/"
          className="transition-opacity hover:opacity-80"
        >
          <BrandMark />
        </Link>

        <div className="flex items-center gap-3">
          <ModeToggle />

          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
        </div>

      </header>


      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 pb-14 pt-16 text-center md:pt-20">

        {/* GitAid logo */}

        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/20">
          <GitAidIcon className="size-9" />
        </div>


        {/* Heading */}

        <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          GitAid
        </h1>


        {/* Description */}

        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Connect GitHub, index any repository, and chat with your
          codebase using retrieval-augmented answers and citations.
        </p>


        {/* Buttons */}

        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">

          <Link
            href="/login"
            className={cn(
              buttonVariants({
                size: "lg",
              }),
              "group gap-2 px-5"
            )}
          >
            <GitHubIcon className="size-4" />

            Continue with GitHub

            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </Link>


          <Link
            href="#how-it-works"
            className={cn(
              buttonVariants({
                variant: "outline",
                size: "lg",
              }),
              "gap-2"
            )}
          >
            <Code2 className="size-4" />

            See how it works
          </Link>

        </div>

      </section>


      {/* =====================================================
          FEATURES
          ===================================================== */}

      <section
        id="how-it-works"
        className="relative z-10 mx-auto max-w-5xl px-5 pb-20"
      >

        <div className="grid gap-3 md:grid-cols-3">

          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className={cn(
                  "group rounded-xl border border-border/70",
                  "bg-card/70 p-4",
                  "backdrop-blur-xl",
                  "transition-all duration-200",
                  "hover:-translate-y-0.5",
                  "hover:border-border",
                  "hover:bg-card"
                )}
              >

                <div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-4" />
                </div>

                <h2 className="text-sm font-semibold">
                  {feature.title}
                </h2>

                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  {feature.description}
                </p>

              </div>
            );
          })}

        </div>

      </section>


      {/* Bottom glow */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-0
          left-1/2
          h-40
          w-[700px]
          -translate-x-1/2
          translate-y-1/2
          rounded-full
          bg-primary/5
          blur-3xl
        "
      />

    </main>
  );
}