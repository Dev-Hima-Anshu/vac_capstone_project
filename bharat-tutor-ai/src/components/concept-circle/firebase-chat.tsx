"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { anonymousLabel, avatarColorClass } from "@/lib/anonymous-profile";
import { subscribeRoomMessages, sendRoomMessage, type ChatMessage } from "@/lib/room-chat";
import { useFirebaseAuth, useLocale } from "@/providers/app-providers";
import { cn } from "@/lib/utils";

type Props = { roomId: string };

export function FirebaseChatSidebar({ roomId }: Props) {
  const { user, firebaseEnabled } = useFirebaseAuth();
  const { t } = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!firebaseEnabled || !roomId) return;
    const unsub = subscribeRoomMessages(roomId, setMessages);
    return () => unsub?.();
  }, [firebaseEnabled, roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const uid = user?.uid ?? "guest";
  const label = user ? anonymousLabel(user.uid) : "Guest";

  const onSend = async () => {
    const text = draft.trim();
    if (!text || !firebaseEnabled || !user) return;
    setDraft("");
    await sendRoomMessage(roomId, { text, uid: user.uid, label });
  };

  return (
    <div className="flex h-full min-h-[220px] flex-col bg-card">
      <div className="border-b border-border px-3 py-2">
        <p className="text-sm font-semibold text-foreground">{t("chatTitle")}</p>
        <p className="text-xs text-muted-foreground">
          {firebaseEnabled ? label : "Connect Firebase to enable live chat."}
        </p>
      </div>
      <ScrollArea className="min-h-0 flex-1 p-3">
        <ul className="flex flex-col gap-2">
          {messages.map((m) => (
            <li
              key={m.id}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm shadow-sm",
                m.uid === uid
                  ? "ml-4 border-primary/20 bg-primary/5"
                  : "mr-4 border-border bg-muted/40",
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    avatarColorClass(m.uid || "x"),
                  )}
                >
                  {m.label}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-foreground/90">{m.text}</p>
            </li>
          ))}
        </ul>
        <div ref={bottomRef} />
      </ScrollArea>
      <div className="flex gap-2 border-t border-border p-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("chatPlaceholder")}
          disabled={!firebaseEnabled || !user}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          className="text-sm"
        />
        <Button
          type="button"
          size="icon"
          className="shrink-0"
          disabled={!firebaseEnabled || !user}
          onClick={onSend}
          aria-label={t("send")}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
