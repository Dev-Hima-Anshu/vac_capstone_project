import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-4">
      <h1 className="text-2xl font-bold text-primary">Page not found</h1>
      <p className="text-center text-muted-foreground">
        That study topic or path does not exist yet.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Back to BharatTutor AI
      </Link>
    </div>
  );
}
