"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Info,
  Loader2,
  MessageCircle,
  Mic,
  VideoOff,
} from "lucide-react";
import Link from "next/link";
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

const JitsiMeeting = dynamic(
  () => import("@jitsi/react-sdk").then((m) => m.JitsiMeeting),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[320px] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" aria-hidden />
        <span>Loading classroom…</span>
      </div>
    ),
  },
);

type Props = {
  roomName: string;
  topicLabel: string;
};

const BADGE_ID = "collaborative-learning";

/**
 * Embeds Jitsi Meet (mic/cam/screen share via Jitsi toolbar) and pairs it with Firebase chat.
 * Awards a badge when the learner closes the meeting (onReadyToClose).
 */
export function ConceptCircleRoom({ roomName, topicLabel }: Props) {
  const { user } = useFirebaseAuth();
  const { t } = useLocale();
  const [leftNotice, setLeftNotice] = useState<string | null>(null);

  const displayName = user ? anonymousLabel(user.uid) : "BharatTutor Learner";

  // “Room available” list will depend on lastActiveAt (updated on join).
  useEffect(() => {
    // Firestore touch is handled by the lobby page; keep room component independent.
  }, []);

  const handleReadyToClose = useCallback(async () => {
    if (user?.uid) {
      await awardBadge(user.uid, BADGE_ID);
    }
    setLeftNotice(t("badgeEarned"));
  }, [user?.uid, t]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-background via-sky-50/20 to-orange-50/20">
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
        <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-sm font-medium text-emerald-900">
          {leftNotice}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="relative min-h-[55vh] flex-1 overflow-hidden bg-black/5 lg:min-h-0">
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={roomName}
            userInfo={{ displayName, email: "" }}
            lang="en"
            onReadyToClose={handleReadyToClose}
            configOverwrite={{
              startWithAudioMuted: false,
              // Camera is NOT mandatory for discussion rooms.
              startWithVideoMuted: true,
            }}
            interfaceConfigOverwrite={{
              TOOLBAR_BUTTONS: [
                "microphone",
                "camera",
                "desktop",
                "hangup",
                "settings",
                "tileview",
              ],
            }}
            getIFrameRef={(node) => {
              node.style.height = "100%";
              node.style.width = "100%";
            }}
            spinner={() => (
              <div className="flex h-64 items-center justify-center gap-2 text-white">
                <Loader2 className="size-8 animate-spin" />
              </div>
            )}
          />
        </section>

        {/* Desktop chat */}
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
                    Camera optional. Use mic when you speak. Be respectful and helpful.
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

      {/* Mobile chat sheet */}
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
