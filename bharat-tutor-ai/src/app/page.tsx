"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  BookOpen,
  Loader2,
  Map,
  UploadCloud,
  Users,
  Video,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";
import type { AnalyzeResumeResponse } from "@/types/analyze-resume";
import { CONCEPT_TOPICS } from "@/lib/topics";
import { useLocale } from "@/providers/app-providers";

export default function HomePage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResumeResponse | null>(null);

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setErr(null);
      setBusy(true);
      setResult(null);
      try {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/analyze-resume", { method: "POST", body: fd });
        const data = (await res.json()) as AnalyzeResumeResponse & { error?: string };
        if (!res.ok) {
          setErr(data.error ?? "Upload failed");
          return;
        }
        setResult(data);
        try {
          sessionStorage.setItem("bharat-last-analysis", JSON.stringify(data));
        } catch {
          /* ignore */
        }
      } catch {
        setErr("Network error — try again.");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-sky-50/80 via-background to-orange-50/50">
      <SiteHeader />

      <main className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:px-6 lg:py-14">
        <section className="text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <span aria-hidden>🇮🇳</span> Made for Bharat&apos;s learners
          </p>
          <h1 className="bg-gradient-to-r from-primary via-sky-600 to-orange-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            {t("brand")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{t("tagline")}</p>
        </section>

        <Card className="mx-auto max-w-xl border-primary/20 shadow-lg shadow-primary/10">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <UploadCloud className="size-6 text-primary" aria-hidden />
              {t("uploadTitle")}
            </CardTitle>
            <CardDescription>{t("uploadHint")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <label
              className={cn(
                "flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/35 bg-card px-6 py-12 transition hover:border-primary hover:bg-primary/5",
                busy && "pointer-events-none opacity-70",
              )}
            >
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                disabled={busy}
                onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
              />
              {busy ? (
                <Loader2 className="mb-2 size-10 animate-spin text-primary" aria-hidden />
              ) : (
                <UploadCloud className="mb-2 size-10 text-primary" aria-hidden />
              )}
              <span className="text-center text-sm font-medium text-foreground">
                {busy ? t("analyzing") : "Tap to choose PDF or DOCX"}
              </span>
            </label>
            {err && (
              <p className="text-center text-sm text-destructive" role="alert">
                {err}
              </p>
            )}
          </CardContent>
        </Card>

        {result && (
          <Card className="border-emerald-200/80 bg-emerald-50/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl text-emerald-900">
                You are {result.readinessPercent}% job-ready for {result.roleTitle} in{" "}
                {result.location}!
              </CardTitle>
              <CardDescription className="text-emerald-900/80">
                {result.demo && "Demo mode — add GROQ_API_KEY for real AI analysis."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="list-inside list-disc space-y-2 text-sm font-medium text-emerald-950 sm:list-outside sm:pl-4">
                {result.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                <Button
                  type="button"
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-primary to-sky-600 text-primary-foreground shadow-md"
                  onClick={() =>
                    router.push(`/roadmap?slug=${encodeURIComponent(result.roadmapSlug)}`)
                  }
                >
                  <Map className="size-5" aria-hidden />
                  {t("viewRoadmap")}
                </Button>
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "lg" }),
                    "inline-flex items-center justify-center gap-2",
                  )}
                >
                  <BookOpen className="size-5 shrink-0" aria-hidden />
                  {t("dashboard")}
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Video className="size-6" aria-hidden />
            <h2 className="text-xl font-bold tracking-tight">{t("circleSection")}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Live discussion rooms with mic + optional camera + screen share — plus realtime chat.
            Rooms are organized like a room-list so you can simply join active discussions.
          </p>
          <Link
            href="/circles"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "inline-flex items-center justify-center gap-2",
            )}
          >
            <Users className="size-5 shrink-0" aria-hidden />
            Browse discussion rooms
          </Link>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CONCEPT_TOPICS.map(({ slug, labelKey }) => (
              <Card
                key={slug}
                className="border-orange-200/60 bg-gradient-to-br from-card to-orange-50/30 transition hover:shadow-md"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="size-4 text-orange-600" aria-hidden />
                    {t(labelKey)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/circle/${slug}`}
                    className={cn(
                      buttonVariants({ className: "w-full gap-2" }),
                      "inline-flex items-center justify-center",
                    )}
                  >
                    {t("joinCircle")} {t(labelKey)} ({locale})
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground">{t("demoNotice")}</p>
      </main>
    </div>
  );
}
