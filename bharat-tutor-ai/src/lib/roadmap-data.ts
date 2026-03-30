/**
 * Checklist milestones shown beside roadmap.sh embeds.
 * (The iframe is cross-origin; we track progress on our own aligned steps.)
 */
export type RoadmapStep = { id: string; label: string };

export const ROADMAP_STEPS: Record<string, RoadmapStep[]> = {
  "ai-engineer": [
    { id: "math-stats", label: "Math & statistics foundations" },
    { id: "python-core", label: "Python programming core" },
    { id: "ml-intro", label: "Machine learning fundamentals" },
    { id: "deep-learning", label: "Neural networks & deep learning" },
    { id: "nlp-llm", label: "NLP, transformers & LLMs" },
    { id: "mlops", label: "MLOps, deployment & monitoring" },
    { id: "projects", label: "Portfolio projects & case studies" },
    { id: "interview", label: "Interview prep & system thinking" },
  ],
  "computer-science": [
    { id: "dsa", label: "Data structures & algorithms" },
    { id: "os", label: "Operating systems" },
    { id: "networks", label: "Computer networks" },
    { id: "db", label: "Databases & SQL" },
  ],
};

export const DEFAULT_ROADMAP_SLUG = "ai-engineer";

export function roadmapUrlForSlug(slug: string): string {
  const safe = slug.replace(/[^a-z0-9-]/gi, "").toLowerCase() || DEFAULT_ROADMAP_SLUG;
  return `https://roadmap.sh/${safe}`;
}

export function stepsForSlug(slug: string): RoadmapStep[] {
  const key = slug.replace(/[^a-z0-9-]/gi, "").toLowerCase() || DEFAULT_ROADMAP_SLUG;
  return ROADMAP_STEPS[key] ?? ROADMAP_STEPS[DEFAULT_ROADMAP_SLUG];
}
