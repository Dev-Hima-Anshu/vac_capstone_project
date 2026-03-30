"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Settings,
  Users,
  Video,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFirebaseAuth, useLocale } from "@/providers/app-providers";
import { CONCEPT_TOPICS } from "@/lib/topics";
import { subscribeRooms, touchRoom, type ConceptRoom } from "@/lib/rooms";

function roomIdFor(topicSlug: string, language: "en" | "te") {
  return `${topicSlug}-${language}`;
}

function formatRelative(seconds?: number) {
  if (!seconds) return "—";
  const delta = Math.max(0, Math.floor(Date.now() / 1000) - seconds);
  if (delta < 60) return "just now";
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  return `${Math.floor(delta / 86400)}d ago`;
}

export default function CirclesLobbyPage() {
  const { t, locale } = useLocale();
  const { firebaseEnabled } = useFirebaseAuth();
  const [rooms, setRooms] = useState<ConceptRoom[]>([]);
  const [q, setQ] = useState("");
  const [langFilter, setLangFilter] = useState<"all" | "en" | "te">("all");

  useEffect(() => {
    if (!firebaseEnabled) return;
    const unsub = subscribeRooms(setRooms);
    return () => unsub?.();
  }, [firebaseEnabled]);

  const seededRooms = useMemo<ConceptRoom[]>(() => {
    // Always show “default rooms” (topic × language).
    const langs: ("en" | "te")[] = ["en", "te"];
    return CONCEPT_TOPICS.flatMap(({ slug, labelKey }) =>
      langs.map((l) => ({
        id: roomIdFor(slug, l),
        title: `${t(labelKey)} · ${l === "en" ? "English" : "తెలుగు"}`,
        language: l,
        topicSlug: slug,
      })),
    );
  }, [t]);

  const mergedRooms = useMemo(() => {
    const byId = new Map<string, ConceptRoom>();
    for (const r of seededRooms) byId.set(r.id, r);
    for (const r of rooms) byId.set(r.id, { ...byId.get(r.id), ...r });
    return Array.from(byId.values());
  }, [rooms, seededRooms]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return mergedRooms.filter((r) => {
      if (langFilter !== "all" && r.language !== langFilter) return false;
      if (!needle) return true;
      return (
        r.title.toLowerCase().includes(needle) ||
        r.topicSlug.toLowerCase().includes(needle)
      );
    });
  }, [mergedRooms, q, langFilter]);

  const onJoin = async (room: ConceptRoom) => {
    // Touch room so it appears “active” in the lobby list for others.
    if (firebaseEnabled) {
      await touchRoom(room.id, {
        title: room.title,
        language: room.language,
        topicSlug: room.topicSlug,
        pinned: room.pinned,
      });
    }
  };

  // Avoid importing client-only button helpers during prerender; keep styles local.
  const joinButtonClass =
    "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(80%_60%_at_50%_0%,rgba(2,132,199,0.18)_0%,rgba(255,255,255,0)_55%),radial-gradient(70%_55%_at_15%_10%,rgba(249,115,22,0.18)_0%,rgba(255,255,255,0)_55%)]">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/85 p-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-primary">
              <Video className="size-6" aria-hidden />
              Concept Circles
            </h1>
            <p className="text-sm text-muted-foreground">
              Pick a room and join the discussion. Camera is optional.
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-3 sm:max-w-xl sm:flex-row sm:justify-end">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by topic or room…"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  langFilter === "all"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/40",
                )}
                onClick={() => setLangFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  langFilter === "en"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/40",
                )}
                onClick={() => setLangFilter("en")}
              >
                English
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  langFilter === "te"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/40",
                )}
                onClick={() => setLangFilter("te")}
              >
                తెలుగు
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((room) => {
            const isRecommended = room.language === (locale === "te" ? "te" : "en");
            const last = formatRelative(room.lastActiveAt?.seconds);
            return (
              <Card
                key={room.id}
                className="group relative overflow-hidden border-border bg-card/85 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="flex min-w-0 items-center gap-2 text-base">
                      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-sky-600 text-primary-foreground shadow-sm">
                        <Users className="size-4" aria-hidden />
                      </span>
                      <span className="truncate text-foreground">{room.title}</span>
                    </CardTitle>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted/40"
                      aria-label="Room settings (demo)"
                      title="Room settings (demo)"
                    >
                      <Settings className="size-4" aria-hidden />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-muted/40">
                      {room.language === "en" ? "English" : "తెలుగు"}
                    </Badge>
                    <Badge variant="secondary" className="bg-muted/40">
                      Last active: {last}
                    </Badge>
                    {isRecommended && (
                      <Badge className="bg-orange-500 text-white">
                        <Sparkles className="mr-1 size-3" aria-hidden />
                        Recommended
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="aspect-square rounded-full border border-dashed border-border bg-background/30" />
                    <div className="aspect-square rounded-full border border-dashed border-border bg-background/30" />
                    <div className="aspect-square rounded-full border border-dashed border-border bg-background/30" />
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/circle/${room.topicSlug}`}
                      className={cn(joinButtonClass, "group-hover:shadow-sm")}
                      onClick={() => void onJoin(room)}
                    >
                      <MessageCircle className="size-4" aria-hidden />
                      Join and talk now
                    </Link>
                  </div>
                  {!firebaseEnabled && (
                    <p className="text-xs text-muted-foreground">
                      Add Firebase keys to see live “available rooms” updates.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}

