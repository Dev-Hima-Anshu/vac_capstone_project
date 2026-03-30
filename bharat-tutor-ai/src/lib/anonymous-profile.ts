/**
 * Friendly anonymous display names + consistent colors for Concept Circle chat.
 */
const AVATARS = ["🐯", "🦊", "🐼", "🦁", "🐸", "🦉", "🐙", "🦋", "🐝", "🦄"] as const;

const COLORS = [
  "bg-orange-100 text-orange-900 border-orange-200",
  "bg-sky-100 text-sky-900 border-sky-200",
  "bg-emerald-100 text-emerald-900 border-emerald-200",
  "bg-violet-100 text-violet-900 border-violet-200",
  "bg-amber-100 text-amber-900 border-amber-200",
] as const;

function hashUid(uid: string): number {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  return h;
}

export function anonymousLabel(uid: string): string {
  const emoji = AVATARS[hashUid(uid) % AVATARS.length];
  const n = (hashUid(uid + "n") % 900) + 100;
  return `Learner ${emoji}${n}`;
}

export function avatarColorClass(uid: string): string {
  return COLORS[hashUid(uid + "c") % COLORS.length];
}
