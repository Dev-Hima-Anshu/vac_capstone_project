"use client";

import Link from "next/link";
import { GraduationCap, LayoutDashboard } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/app-providers";
import { LanguageToggle } from "@/components/language-toggle";

export function SiteHeader() {
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-[oklch(0.99_0.02_95_/_0.92)] backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-primary"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-sky-600 text-primary-foreground shadow-sm">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          <span className="hidden text-foreground sm:inline">{t("brand")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 no-underline",
            )}
          >
            <LayoutDashboard className="size-3.5 shrink-0" aria-hidden />
            {t("dashboard")}
          </Link>
        </div>
      </div>
    </header>
  );
}
