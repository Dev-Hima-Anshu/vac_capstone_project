"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ConceptCircleRoom } from "@/components/concept-circle/jitsi-room";
import { subscribeRoom, touchRoom, type ConceptRoom } from "@/lib/rooms";
import { useFirebaseAuth } from "@/providers/app-providers";
import { useLocale } from "@/providers/app-providers";
import { CONCEPT_TOPICS } from "@/lib/topics";
import type { StringKey } from "@/lib/strings";

function inferStarterTopicLabel(
  roomId: string,
  t: (key: StringKey) => string,
): string {
  const tokens = roomId.split("-");
  const langIdx = tokens.findIndex((x) => x === "en" || x === "te");
  if (!tokens[0] || tokens[0] !== "starter" || langIdx <= 1) return prettyLabel(roomId);
  const slug = tokens.slice(1, langIdx).join("-");
  const hit = CONCEPT_TOPICS.find((x) => x.slug === slug);
  if (!hit) return prettyLabel(roomId);
  return t(hit.labelKey);
}

function prettyLabel(roomId: string): string {
  return roomId
    .split("-")
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export default function DynamicRoomPage() {
  const params = useParams<{ roomId: string }>();
  const raw = (params?.roomId ?? "").toLowerCase();
  const roomId = decodeURIComponent(raw);
  const { user, firebaseEnabled } = useFirebaseAuth();
  const { t } = useLocale();
  const [room, setRoom] = useState<ConceptRoom | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeRoom(roomId, setRoom);
    return () => unsub?.();
  }, [roomId]);

  useEffect(() => {
    if (!firebaseEnabled || !roomId) return;
    // Ensure room appears as active once someone opens it.
    void (async () => {
      try {
        await touchRoom(roomId, {
          title: room?.title ?? inferStarterTopicLabel(roomId, t),
          language: room?.language ?? "en",
          topicSlug: room?.topicSlug ?? roomId,
          ...(room?.welcomeMessage != null && room.welcomeMessage !== ""
            ? { welcomeMessage: room.welcomeMessage }
            : {}),
          ...(user?.uid ? { createdByUid: user.uid } : {}),
          ...(typeof room?.pinned === "boolean" ? { pinned: room.pinned } : {}),
        });
      } catch {
        // If Firestore rules reject the write, we still let video + local chat work.
      }
    })();
  }, [firebaseEnabled, roomId, room, user?.uid, t]);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return `/room/${roomId}`;
    return `${window.location.origin}/room/${roomId}`;
  }, [roomId]);

  return (
    <ConceptCircleRoom
      roomName={roomId}
      topicLabel={room?.title ?? inferStarterTopicLabel(roomId, t)}
      welcomeMessage={room?.welcomeMessage}
      inviteUrl={inviteUrl}
    />
  );
}

