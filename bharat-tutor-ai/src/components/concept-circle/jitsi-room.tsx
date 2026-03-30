"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Info,
  Loader2,
  MessageCircle,
  Mic,
  VideoOff,
} from "lucide-react";
import Link from "next/link";
import type { DailyCall } from "@daily-co/daily-js";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { anonymousLabel } from "@/lib/anonymous-profile";
import { awardBadge } from "@/lib/user-doc";
import { FirebaseChatSidebar } from "@/components/concept-circle/firebase-chat";
import { useFirebaseAuth, useLocale } from "@/providers/app-providers";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type Props = {
  roomName: string;
  topicLabel: string;
  welcomeMessage?: string;
  inviteUrl?: string;
};

const BADGE_ID = "collaborative-learning";

/**
 * Concept Circle video: Daily.co Prebuilt (mic, cam, screen share) + Firebase chat sidebar.
 * Rooms are created/resolved via `/api/daily-room` using `DAILY_API_KEY`.
 */
export function ConceptCircleRoom({
  roomName,
  topicLabel,
  welcomeMessage,
  inviteUrl,
}: Props) {
  const { user, profileName } = useFirebaseAuth();
  const { t } = useLocale();
  const [leftNotice, setLeftNotice] = useState<string | null>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const [joining, setJoining] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);

  const displayName = profileName || (user ? anonymousLabel(user.uid) : "BharatTutor Learner");

  const handleLeftMeeting = useCallback(async () => {
    if (user?.uid) {
      await awardBadge(user.uid, BADGE_ID);
    }
    setLeftNotice(t("badgeEarned"));
  }, [user?.uid, t]);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container || !roomName) return;

    setCallError(null);
    setJoining(true);

    (async () => {
      try {
        const res = await fetch("/api/daily-room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName }),
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok) {
          throw new Error(data.error || `Could not create Daily room (${res.status})`);
        }
        if (!data.url) {
          throw new Error("Daily did not return a room URL");
        }
        if (cancelled) return;

        const Daily = (await import("@daily-co/daily-js")).default;
        if (cancelled || !containerRef.current) return;

        callRef.current?.destroy();
        callRef.current = null;

        const frame = Daily.createFrame(containerRef.current, {
          showLeaveButton: true,
          iframeStyle: {
            width: "100%",
            height: "100%",
            border: "0",
            position: "absolute",
            top: "0",
            left: "0",
          },
        });
        callRef.current = frame;

        frame.on("left-meeting", () => {
          void handleLeftMeeting();
        });
        frame.on("error", () => {
          if (!cancelled) setCallError("Video call error. Try refreshing the page.");
        });

        await frame.join({
          url: data.url,
          userName: displayName.slice(0, 64),
          startVideoOff: true,
          startAudioOff: false,
        });
      } catch (e) {
        if (!cancelled) {
          setCallError(e instanceof Error ? e.message : "Failed to start Daily call");
        }
      } finally {
        if (!cancelled) setJoining(false);
      }
    })();

    return () => {
      cancelled = true;
      callRef.current?.destroy();
      callRef.current = null;
    };
  }, [roomName, displayName, handleLeftMeeting]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-background via-sky-50/20 to-orange-50/20 dark:via-slate-900/40 dark:to-slate-950">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card/90 px-3 py-2 backdrop-blur sm:px-4">
        <Link
          href="/circles"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to rooms
        </Link>
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("circleSection")}
          </p>
          <h1 className="text-sm font-semibold text-primary sm:text-base">{topicLabel}</h1>
        </div>
        <span className="hidden w-[120px] sm:block" aria-hidden />
      </header>

      {leftNotice && (
        <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-sm font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
          {leftNotice}
        </div>
      )}

      {welcomeMessage && (
        <div className="border-b border-primary/15 bg-primary/5 px-4 py-2">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
            <p className="truncate text-sm text-foreground">
              <span className="font-semibold text-primary">Welcome:</span> {welcomeMessage}
            </p>
            {inviteUrl && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5"
                onClick={() => void navigator.clipboard.writeText(inviteUrl)}
              >
                <Copy className="size-3.5" aria-hidden />
                Copy invite link
              </Button>
            )}
          </div>
        </div>
      )}

      {callError && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
          {callError}{" "}
          <span className="text-muted-foreground">
            Add `DAILY_API_KEY` in `.env.local` from Daily dashboard → Developers.
          </span>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="relative min-h-[55vh] flex-1 overflow-hidden bg-black/5 lg:min-h-0">
          {joining && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background/60 text-muted-foreground backdrop-blur-sm">
              <Loader2 className="size-6 animate-spin" aria-hidden />
              Connecting to Daily…
            </div>
          )}
          <div ref={containerRef} className="relative h-full min-h-[320px] w-full" />
        </section>

        <aside className="hidden w-full max-w-md border-t border-border lg:block lg:w-[320px] lg:border-l lg:border-t-0">
          <div className="flex h-full flex-col">
            <div className="border-b border-border bg-card px-3 py-3">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Info className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Room rules</p>
                  <p className="text-xs text-muted-foreground">
                    Camera optional. Use mic when you speak. Screen share is in the Daily toolbar.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2 py-0.5">
                      <Mic className="size-3" aria-hidden />
                      Mic-first
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2 py-0.5">
                      <VideoOff className="size-3" aria-hidden />
                      Camera optional
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <FirebaseChatSidebar roomId={roomName} />
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed bottom-4 right-4 z-40 lg:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                type="button"
                size="icon-lg"
                className="size-14 rounded-full shadow-lg"
              />
            }
            aria-label={t("chatTitle")}
          >
            <MessageCircle className="size-6" />
          </SheetTrigger>
          <SheetContent side="right" className="flex w-[min(100vw,380px)] flex-col p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>{t("chatTitle")}</SheetTitle>
            </SheetHeader>
            <div className="min-h-0 flex-1">
              <FirebaseChatSidebar roomId={roomName} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
