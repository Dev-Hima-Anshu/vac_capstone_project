"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  PlusCircle,
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
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useFirebaseAuth, useLocale } from "@/providers/app-providers";
import { CONCEPT_TOPICS } from "@/lib/topics";
import {
  safeRoomId,
  subscribeRooms,
  touchRoom,
  type ConceptRoom,
} from "@/lib/rooms";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  const { firebaseEnabled, user } = useFirebaseAuth();
  const [rooms, setRooms] = useState<ConceptRoom[]>([]);
  const [q, setQ] = useState("");
  const [langFilter, setLangFilter] = useState<"all" | "en" | "te">("all");
  const [topic, setTopic] = useState("general-dsa");
  const [lang, setLang] = useState<"en" | "te">(locale === "te" ? "te" : "en");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Welcome! Raise your hand and speak one by one.",
  );
  const [customName, setCustomName] = useState("");
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [localRooms, setLocalRooms] = useState<ConceptRoom[]>([]);

  useEffect(() => {
    if (!firebaseEnabled) return;
    const unsub = subscribeRooms(setRooms);
    return () => unsub?.();
  }, [firebaseEnabled]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bharat-local-rooms");
      if (!raw) return;
      const parsed = JSON.parse(raw) as ConceptRoom[];
      if (Array.isArray(parsed)) setLocalRooms(parsed);
    } catch {
      /* ignore */
    }
  }, []);

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
    for (const r of localRooms) byId.set(r.id, { ...byId.get(r.id), ...r });
    return Array.from(byId.values());
  }, [rooms, seededRooms, localRooms]);

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
        welcomeMessage: room.welcomeMessage,
        createdByUid: room.createdByUid,
        pinned: room.pinned,
      });
    }
  };

  const createRoom = async () => {
    const topicSlug = safeRoomId(topic || "general-topic");
    const suffix = safeRoomId(customName || "room");
    const roomId = safeRoomId(`${topicSlug}-${lang}-${suffix}`) || `${topicSlug}-${lang}`;
    const title =
      customName.trim().length > 0
        ? customName.trim()
        : `${topicSlug.replace(/-/g, " ")} (${lang === "en" ? "English" : "తెలుగు"})`;
    const payload: Omit<ConceptRoom, "id"> = {
      title,
      language: lang,
      topicSlug,
      welcomeMessage: welcomeMessage.trim(),
      createdByUid: user?.uid,
      pinned: false,
    };
    if (firebaseEnabled) {
      try {
        await touchRoom(roomId, payload);
      } catch {
        // Fall back to local rooms if Firestore write is restricted.
      }
    }
    setLocalRooms((prev) => {
      const next = [{ id: roomId, ...payload }, ...prev.filter((r) => r.id !== roomId)];
      try {
        localStorage.setItem("bharat-local-rooms", JSON.stringify(next.slice(0, 40)));
      } catch {
        /* ignore */
      }
      return next;
    });
    setCreatedRoomId(roomId);
    setCreateOpen(false);
  };

  const createdRoomInvite =
    createdRoomId && typeof window !== "undefined"
      ? `${window.location.origin}/room/${createdRoomId}`
      : createdRoomId
        ? `/room/${createdRoomId}`
        : null;

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

        <div className="flex items-center justify-between rounded-2xl border border-border bg-card/85 p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Want a custom panel? Create a new discussion room and share invite link.
          </p>
          <Sheet open={createOpen} onOpenChange={setCreateOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                />
              }
            >
              <PlusCircle className="size-4" aria-hidden />
              Create new room
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw,460px)] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Create room for discussion</SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="linked-lists"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-name">Room name</Label>
              <Input
                id="room-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Linked Lists Telugu Discussion"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={lang}
                onChange={(e) => setLang(e.target.value as "en" | "te")}
              >
                <option value="en">English</option>
                <option value="te">తెలుగు</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="welcome">Welcome message</Label>
              <Input
                id="welcome"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="Welcome everyone..."
              />
            </div>
                <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={joinButtonClass}
                onClick={() => void createRoom()}
              >
                Create room
              </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {createdRoomInvite && (
          <Card className="border-border bg-card/90 shadow-sm">
            <CardContent className="flex flex-wrap items-center gap-2 pt-4">
                <>
                  <Link
                    href={`/room/${createdRoomId}`}
                    className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40"
                  >
                    Open room
                  </Link>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted/40"
                    onClick={() => void navigator.clipboard.writeText(createdRoomInvite)}
                  >
                    <Copy className="size-4" aria-hidden />
                    Copy invite link
                  </button>
                </>
            </CardContent>
          </Card>
        )}

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
                      href={`/room/${room.id}`}
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

