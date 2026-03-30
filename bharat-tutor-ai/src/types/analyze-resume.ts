export type AnalyzeResumeResponse = {
  readinessPercent: number;
  roleTitle: string;
  location: string;
  steps: string[];
  roadmapSlug: string;
  demo?: boolean;
};
