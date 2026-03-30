"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  ListChecks,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  DEFAULT_ROADMAP_SLUG,
  roadmapUrlForSlug,
  stepsForSlug,
} from "@/lib/roadmap-data";
import {
  ensureUserDoc,
  setRoadmapSlug,
  subscribeUserProgress,
  toggleRoadmapStep,
  type UserProgressDoc,
} from "@/lib/user-doc";
import { useFirebaseAuth, useLocale } from "@/providers/app-providers";

function loadLocalSteps(slug: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(`bharat-roadmap-${slug}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveLocalSteps(slug: string, ids: Set<string>) {
  try {
    sessionStorage.setItem(`bharat-roadmap-${slug}`, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

/**
 * Full-screen roadmap.sh embed with a companion checklist (Firestore-backed).
 * Cross-origin iframe limits hooking into roadmap nodes; our steps mirror the official path.
 */
export function RoadmapEmbedClient() {
  const params = useSearchParams();
  const slug =
    params.get("slug")?.replace(/[^a-z0-9-]/gi, "").toLowerCase() ||
    DEFAULT_ROADMAP_SLUG;
  const officialUrl = useMemo(() => roadmapUrlForSlug(slug), [slug]);
  const steps = useMemo(() => stepsForSlug(slug), [slug]);
  const { user, ready, firebaseEnabled } = useFirebaseAuth();
  const { t } = useLocale();

  const [remote, setRemote] = useState<UserProgressDoc | null>(null);
  const [localDone, setLocalDone] = useState<Set<string>>(() =>
    typeof window === "undefined" ? new Set() : loadLocalSteps(slug),
  );

  useEffect(() => {
    setLocalDone(loadLocalSteps(slug));
  }, [slug]);

  useEffect(() => {
    if (!firebaseEnabled || !user) return;
    void ensureUserDoc(user.uid);
    void setRoadmapSlug(user.uid, slug);
  }, [firebaseEnabled, user, slug]);

  useEffect(() => {
    if (!firebaseEnabled || !user) {
      setRemote(null);
      return;
    }
    const unsub = subscribeUserProgress(user.uid, setRemote);
    return () => unsub?.();
  }, [firebaseEnabled, user]);

  const completed = useMemo(() => {
    if (firebaseEnabled && user) {
      return new Set(remote?.roadmapCompletedSteps ?? []);
    }
    return localDone;
  }, [firebaseEnabled, user, remote?.roadmapCompletedSteps, localDone]);

  const doneCount = steps.filter((s) => completed.has(s.id)).length;
  const progressPct = Math.round((doneCount / Math.max(steps.length, 1)) * 100);

  const toggle = useCallback(
    async (stepId: string, isDone: boolean) => {
      if (firebaseEnabled && user) {
        await toggleRoadmapStep(user.uid, stepId, isDone, steps.length);
        return;
      }
      setLocalDone((prev) => {
        const next = new Set(prev);
        if (isDone) next.add(stepId);
        else next.delete(stepId);
        saveLocalSteps(slug, next);
        return next;
      });
    },
    [firebaseEnabled, user, slug, steps.length],
  );

  const stepList = (
    <ul className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto pr-1">
      {steps.map((s) => {
        const isDone = completed.has(s.id);
        return (
          <li
            key={s.id}
            className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 shadow-sm"
          >
            <button
              type="button"
              className="mt-0.5 shrink-0 text-primary"
              onClick={() => toggle(s.id, !isDone)}
              aria-pressed={isDone}
              aria-label={`${t("markDone")}: ${s.label}`}
            >
              {isDone ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : (
                <Circle className="size-5 text-muted-foreground" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug text-foreground">{s.label}</p>
              <Button
                type="button"
                variant="link"
                className="h-auto px-0 py-1 text-xs text-primary"
                onClick={() => toggle(s.id, !isDone)}
              >
                {isDone ? t("undo") : t("markDone")}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="flex items-center justify-between gap-2 border-b border-border bg-card/90 px-3 py-2 backdrop-blur sm:px-4">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 shrink-0")}
        >
          <ArrowLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">{t("closeRoadmap")}</span>
        </Link>
        <p className="truncate text-center text-sm font-semibold text-primary">
          roadmap.sh / {slug}
        </p>
        <div className="w-10 sm:w-24" />
      </header>

      <div className="relative min-h-0 flex-1">
        {/* 
          roadmap.sh sets frame-ancestors restrictions on many routes, so iframe embedding
          can fail with “refused to connect”. This MVP always provides a working path:
          open the official roadmap in a new tab + track progress in our checklist.
        */}
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_360px] lg:gap-8 lg:px-6 lg:py-10">
          <section className="rounded-2xl border border-border bg-gradient-to-br from-card to-orange-50/25 p-6 shadow-sm">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Official roadmap (opens externally)
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                  roadmap.sh / <span className="text-primary">{slug}</span>
                </h2>
                <p className="mt-2 max-w-prose text-sm text-muted-foreground">
                  If your browser blocks embedding, use the button below. Your progress is
                  tracked here with the checklist.
                </p>
              </div>
              <a
                href={officialUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gap-2 bg-gradient-to-r from-primary to-sky-600 text-primary-foreground shadow-md",
                )}
              >
                <ExternalLink className="size-5" aria-hidden />
                Open Official Roadmap
              </a>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-background/60 p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">
                {t("roadmapSection")} · {t("yourJourney")}
              </p>
              {stepList}
            </div>
          </section>

          <aside className="rounded-2xl border border-border bg-popover p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{t("roadmapProgress")}</p>
              <span className="font-semibold tabular-nums text-primary">
                {firebaseEnabled && !ready ? "…" : `${progressPct}%`}
              </span>
            </div>
            <Progress value={progressPct} className="mt-3 h-3" />
            <p className="mt-2 text-xs text-muted-foreground">
              {doneCount} / {steps.length} milestones checked
            </p>
            {!firebaseEnabled && (
              <p className="mt-3 text-xs font-medium text-amber-800">
                Progress is saved in this browser (add Firebase keys to sync).
              </p>
            )}
          </aside>
        </div>

        <div className="pointer-events-none fixed bottom-20 right-3 z-10 lg:hidden">
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  size="lg"
                  className="pointer-events-auto gap-2 rounded-full shadow-lg"
                />
              }
            >
              <ListChecks className="size-5" />
              <span className="max-w-[140px] truncate">{t("openChecklist")}</span>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85dvh]">
              <SheetHeader>
                <SheetTitle>{t("roadmapSection")}</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6">{stepList}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <footer className="border-t border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium text-muted-foreground">
              {t("roadmapProgress")}
              {!firebaseEnabled && (
                <span className="ml-1 text-xs text-amber-800">(saved in this browser)</span>
              )}
            </span>
            <span className="font-semibold tabular-nums text-primary">
              {firebaseEnabled && !ready ? "…" : `${progressPct}%`}
            </span>
          </div>
          <Progress value={progressPct} className="h-2" />
          <p className="text-center text-xs text-muted-foreground">
            {doneCount} / {steps.length} milestones checked
          </p>
        </div>
      </footer>
    </div>
  );
}
