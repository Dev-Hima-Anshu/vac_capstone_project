import type { StringKey } from "@/lib/strings";

/** Concept Circle topics shown on the home page — URL slug → i18n key for title. */
export const CONCEPT_TOPICS: { slug: string; labelKey: StringKey }[] = [
  { slug: "linked-lists", labelKey: "topicLinkedLists" },
  { slug: "python-ml", labelKey: "topicPythonMl" },
  { slug: "system-design", labelKey: "topicSystemDesign" },
];

export function isValidTopicSlug(slug: string): boolean {
  return CONCEPT_TOPICS.some((t) => t.slug === slug);
}

export function titleForTopicSlug(slug: string): StringKey | null {
  const row = CONCEPT_TOPICS.find((t) => t.slug === slug);
  return row?.labelKey ?? null;
}
