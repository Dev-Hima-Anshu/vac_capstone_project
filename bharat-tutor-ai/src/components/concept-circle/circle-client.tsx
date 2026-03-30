"use client";

import { ConceptCircleRoom } from "@/components/concept-circle/jitsi-room";
import { titleForTopicSlug } from "@/lib/topics";
import { useLocale } from "@/providers/app-providers";

type Props = { topicSlug: string };

/**
 * Builds Jitsi room id `{topic}-{locale}` (e.g. linked-lists-te) per project spec.
 */
export function ConceptCircleClient({ topicSlug }: Props) {
  const { locale, t } = useLocale();
  const labelKey = titleForTopicSlug(topicSlug);
  const topicLabel = labelKey
    ? t(labelKey)
    : topicSlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
  const roomName = `${topicSlug}-${locale}`;

  return <ConceptCircleRoom roomName={roomName} topicLabel={topicLabel} />;
}
