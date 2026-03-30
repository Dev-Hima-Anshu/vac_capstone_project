import { notFound } from "next/navigation";
import { ConceptCircleClient } from "@/components/concept-circle/circle-client";
import { isValidTopicSlug } from "@/lib/topics";

type PageProps = { params: Promise<{ topic: string }> };

export default async function ConceptCirclePage({ params }: PageProps) {
  const { topic } = await params;
  const slug = decodeURIComponent(topic).toLowerCase();
  if (!isValidTopicSlug(slug)) {
    notFound();
  }
  return <ConceptCircleClient topicSlug={slug} />;
}
