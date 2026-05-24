"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <span className="text-4xl">⚠️</span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Dashboard Error</h1>
      <p className="max-w-md text-muted-foreground">
        Something went wrong loading this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Reload
      </button>
    </div>
  );
}