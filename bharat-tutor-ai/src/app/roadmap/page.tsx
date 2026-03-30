import { Suspense } from "react";
import { RoadmapEmbedClient } from "@/components/roadmap/roadmap-embed";

function RoadmapFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
      Loading roadmap…
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense fallback={<RoadmapFallback />}>
      <RoadmapEmbedClient />
    </Suspense>
  );
}
