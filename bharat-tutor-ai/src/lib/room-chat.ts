import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

export type ChatMessage = {
  id: string;
  text: string;
  uid: string;
  label: string;
  createdAt?: { seconds: number };
};

export function subscribeRoomMessages(
  roomId: string,
  onMessages: (items: ChatMessage[]) => void,
): Unsubscribe | null {
  const db = getFirebaseDb();
  if (!db) return null;
  const q = query(
    collection(db, "conceptRooms", roomId, "messages"),
    orderBy("createdAt", "asc"),
    limit(200),
  );
  return onSnapshot(q, (snap) => {
    const items: ChatMessage[] = snap.docs.map((d) => {
      const data = d.data() as {
        text?: string;
        uid?: string;
        label?: string;
        createdAt?: { seconds: number };
      };
      return {
        id: d.id,
        text: data.text ?? "",
        uid: data.uid ?? "",
        label: data.label ?? "Learner",
        createdAt: data.createdAt,
      };
    });
    onMessages(items);
  });
}

export async function sendRoomMessage(
  roomId: string,
  payload: { text: string; uid: string; label: string },
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  await addDoc(collection(db, "conceptRooms", roomId, "messages"), {
    text: payload.text,
    uid: payload.uid,
    label: payload.label,
    createdAt: serverTimestamp(),
  });
}
