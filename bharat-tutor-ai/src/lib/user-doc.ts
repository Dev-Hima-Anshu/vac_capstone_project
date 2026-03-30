import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

export type UserProgressDoc = {
  roadmapSlug?: string;
  roadmapCompletedSteps?: string[];
  roadmapProgressPercent?: number;
  badges?: string[];
};

function usersDocRef(uid: string) {
  const db = getFirebaseDb();
  if (!db) return null;
  return doc(db, "users", uid);
}

/**
 * Merges learner progress under `users/{uid}` for roadmap + badges.
 */
export async function ensureUserDoc(uid: string): Promise<void> {
  const ref = usersDocRef(uid);
  if (!ref) return;
  await setDoc(ref, { updatedAt: serverTimestamp() }, { merge: true });
}

export function subscribeUserProgress(
  uid: string,
  onData: (data: UserProgressDoc | null) => void,
): Unsubscribe | null {
  const ref = usersDocRef(uid);
  if (!ref) return null;
  return onSnapshot(ref, (snap) => {
    onData(snap.exists() ? (snap.data() as UserProgressDoc) : null);
  });
}

export async function setRoadmapSlug(uid: string, slug: string): Promise<void> {
  const ref = usersDocRef(uid);
  if (!ref) return;
  await setDoc(
    ref,
    { roadmapSlug: slug, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function toggleRoadmapStep(
  uid: string,
  stepId: string,
  completed: boolean,
  totalSteps: number,
): Promise<void> {
  const ref = usersDocRef(uid);
  if (!ref) return;
  const snap = await getDoc(ref);
  const prev: string[] = (snap.data()?.roadmapCompletedSteps as string[]) ?? [];
  const updated = completed
    ? Array.from(new Set([...prev, stepId]))
    : prev.filter((id) => id !== stepId);
  const roadmapProgressPercent = Math.round(
    (updated.length / Math.max(totalSteps, 1)) * 100,
  );
  await setDoc(
    ref,
    {
      roadmapCompletedSteps: updated,
      roadmapProgressPercent,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function awardBadge(uid: string, badgeId: string): Promise<void> {
  const ref = usersDocRef(uid);
  if (!ref) return;
  const snap = await getDoc(ref);
  const existing: string[] = (snap.data()?.badges as string[]) ?? [];
  if (existing.includes(badgeId)) return;
  await setDoc(
    ref,
    { badges: [...existing, badgeId], updatedAt: serverTimestamp() },
    { merge: true },
  );
}
