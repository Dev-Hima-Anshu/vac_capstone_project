"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ConceptCircleRoom } from "@/components/concept-circle/jitsi-room";
import { subscribeRoom, touchRoom, type ConceptRoom } from "@/lib/rooms";
import { useFirebaseAuth } from "@/providers/app-providers";

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
  const [room, setRoom] = useState<ConceptRoom | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeRoom(roomId, setRoom);
    return () => unsub?.();
  }, [roomId]);

  useEffect(() => {
    if (!firebaseEnabled || !roomId) return;
    // Ensure room appears as active once someone opens it.
    void touchRoom(roomId, {
      title: room?.title ?? prettyLabel(roomId),
      language: room?.language ?? "en",
      topicSlug: room?.topicSlug ?? roomId,
      ...(room?.welcomeMessage != null && room.welcomeMessage !== ""
        ? { welcomeMessage: room.welcomeMessage }
        : {}),
      ...(user?.uid ? { createdByUid: user.uid } : {}),
      ...(typeof room?.pinned === "boolean" ? { pinned: room.pinned } : {}),
    });
  }, [firebaseEnabled, roomId, room, user?.uid]);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return `/room/${roomId}`;
    return `${window.location.origin}/room/${roomId}`;
  }, [roomId]);

  return (
    <ConceptCircleRoom
      roomName={roomId}
      topicLabel={room?.title ?? prettyLabel(roomId)}
      welcomeMessage={room?.welcomeMessage}
      inviteUrl={inviteUrl}
    />
  );
}

