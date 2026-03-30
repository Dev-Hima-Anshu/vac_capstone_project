"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/strings";
import { useLocale } from "@/providers/app-providers";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  const cycle = () => {
    const next: Locale = locale === "en" ? "te" : "en";
    setLocale(next);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-1.5 text-muted-foreground"
      onClick={cycle}
      title={`${t("langEnglish")} / ${t("langTelugu")}`}
    >
      <Languages className="size-4 shrink-0" aria-hidden />
      <span className="hidden text-xs font-medium sm:inline">
        {locale === "en" ? t("langEnglish") : t("langTelugu")}
      </span>
    </Button>
  );
}
