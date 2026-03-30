import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  doc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

/**
 * Firestore rejects `undefined` anywhere in document data. Strip before setDoc/updateDoc.
 */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

export type ConceptRoom = {
  id: string;
  title: string;
  language: "en" | "te";
  topicSlug: string;
  welcomeMessage?: string;
  createdByUid?: string;
  lastActiveAt?: { seconds: number };
  pinned?: boolean;
};

/**
 * Lists rooms from Firestore. We keep it minimal for a 1‑day MVP:
 * a room is considered “available” if it exists and was active recently.
 */
export function subscribeRooms(
  onRooms: (rooms: ConceptRoom[]) => void,
): Unsubscribe | null {
  const db = getFirebaseDb();
  if (!db) return null;
  const q = query(
    collection(db, "conceptRooms"),
    orderBy("lastActiveAt", "desc"),
    limit(60),
  );
  return onSnapshot(q, (snap) => {
    const rooms = snap.docs.map((d) => {
      const data = d.data() as Partial<ConceptRoom>;
      return {
        id: d.id,
        title: data.title ?? d.id,
        language: (data.language as "en" | "te") ?? "en",
        topicSlug: data.topicSlug ?? d.id,
        welcomeMessage:
          typeof data.welcomeMessage === "string" ? data.welcomeMessage : undefined,
        createdByUid:
          typeof data.createdByUid === "string" ? data.createdByUid : undefined,
        lastActiveAt: data.lastActiveAt,
        pinned: Boolean(data.pinned),
      } satisfies ConceptRoom;
    });
    onRooms(rooms);
  });
}

export async function touchRoom(roomId: string, payload: Omit<ConceptRoom, "id">) {
  const db = getFirebaseDb();
  if (!db) return;
  const data = stripUndefined({
    ...payload,
    lastActiveAt: serverTimestamp(),
  } as Record<string, unknown>);
  await setDoc(doc(db, "conceptRooms", roomId), data, { merge: true });
}

export function subscribeRoom(
  roomId: string,
  onRoom: (room: ConceptRoom | null) => void,
): Unsubscribe | null {
  const db = getFirebaseDb();
  if (!db) return null;
  return onSnapshot(doc(db, "conceptRooms", roomId), (snap) => {
    if (!snap.exists()) {
      onRoom(null);
      return;
    }
    const data = snap.data() as Partial<ConceptRoom>;
    onRoom({
      id: snap.id,
      title: data.title ?? snap.id,
      language: (data.language as "en" | "te") ?? "en",
      topicSlug: data.topicSlug ?? snap.id,
      welcomeMessage:
        typeof data.welcomeMessage === "string" ? data.welcomeMessage : undefined,
      createdByUid:
        typeof data.createdByUid === "string" ? data.createdByUid : undefined,
      lastActiveAt: data.lastActiveAt,
      pinned: Boolean(data.pinned),
    });
  });
}

export function safeRoomId(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9- ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

