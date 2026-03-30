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

export type ConceptRoom = {
  id: string;
  title: string;
  language: "en" | "te";
  topicSlug: string;
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
    orderBy("pinned", "desc"),
    orderBy("lastActiveAt", "desc"),
    limit(30),
  );
  return onSnapshot(q, (snap) => {
    const rooms = snap.docs.map((d) => {
      const data = d.data() as Partial<ConceptRoom>;
      return {
        id: d.id,
        title: data.title ?? d.id,
        language: (data.language as "en" | "te") ?? "en",
        topicSlug: data.topicSlug ?? d.id,
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
  await setDoc(
    doc(db, "conceptRooms", roomId),
    {
      ...payload,
      lastActiveAt: serverTimestamp(),
    },
    { merge: true },
  );
}

