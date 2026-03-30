"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Award, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";
import { subscribeUserProgress, type UserProgressDoc } from "@/lib/user-doc";
import { stepsForSlug, DEFAULT_ROADMAP_SLUG } from "@/lib/roadmap-data";
import { useFirebaseAuth, useLocale } from "@/providers/app-providers";

const BADGE_LABELS: Record<string, string> = {
  "collaborative-learning": "Collaborative Learning",
  "roadmap-starter": "Roadmap Starter",
  "roadmap-halfway": "Halfway Hero",
  "roadmap-master": "Roadmap Master",
};

export default function DashboardPage() {
  const { user, firebaseEnabled, isGuestSession } = useFirebaseAuth();
  const { t } = useLocale();
  const [doc, setDoc] = useState<UserProgressDoc | null>(null);

  useEffect(() => {
    if (!firebaseEnabled || !user) {
      setDoc(null);
      return;
    }
    const unsub = subscribeUserProgress(user.uid, setDoc);
    return () => unsub?.();
  }, [firebaseEnabled, user]);

  const slug = doc?.roadmapSlug ?? DEFAULT_ROADMAP_SLUG;
  const steps = stepsForSlug(slug);
  const done = new Set(doc?.roadmapCompletedSteps ?? []);
  const doneCount = steps.filter((s) => done.has(s.id)).length;
  const pctFromDoc = doc?.roadmapProgressPercent;
  const pct =
    typeof pctFromDoc === "number"
      ? pctFromDoc
      : Math.round((doneCount / Math.max(steps.length, 1)) * 100);

  const badges = doc?.badges ?? [];
  const derivedBadges = [
    doneCount >= 1 ? "roadmap-starter" : null,
    pct >= 50 ? "roadmap-halfway" : null,
    pct >= 100 ? "roadmap-master" : null,
  ].filter(Boolean) as string[];
  const allBadges = Array.from(new Set([...badges, ...derivedBadges]));

  if (!user && !isGuestSession) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-background via-orange-50/30 to-sky-50/40">
        <SiteHeader />
        <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-primary">{t("dashboard")}</h1>
          <p className="text-muted-foreground">
            Please login or continue as guest to view your dashboard.
          </p>
          <Link
            href="/auth"
            className={cn(buttonVariants({ size: "lg" }), "inline-flex gap-2")}
          >
            Open Auth
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background via-orange-50/30 to-sky-50/40">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("closeRoadmap")}
        </Link>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary">{t("dashboard")}</h1>
          <p className="text-muted-foreground">{t("yourJourney")}</p>
        </div>

        <Card className="border-primary/15 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-5 text-orange-500" aria-hidden />
              {t("roadmapProgress")}
            </CardTitle>
            <CardDescription>
              {firebaseEnabled
                ? `roadmap.sh / ${slug}`
                : "Connect Firebase to sync progress across devices."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>{doneCount} / {steps.length} steps</span>
              <span className="tabular-nums text-primary">{pct}%</span>
            </div>
            <Progress value={pct} className="h-3" />
          </CardContent>
        </Card>

        <Card className="border-orange-200/80 bg-orange-50/40 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="size-5 text-orange-600" aria-hidden />
              {t("badges")}
            </CardTitle>
            <CardDescription>Earned by joining Concept Circles and staying consistent.</CardDescription>
          </CardHeader>
          <CardContent>
            {allBadges.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Join a Concept Circle and leave the room once to unlock your first badge.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {allBadges.map((b) => (
                  <li key={b}>
                    <Badge className="bg-primary text-primary-foreground">
                      {BADGE_LABELS[b] ?? b}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
