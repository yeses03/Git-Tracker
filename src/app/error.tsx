"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-bold text-ink">Something went wrong</h1>
      <p className="text-sm text-muted">The leaderboard couldn&apos;t load. Please try again in a moment.</p>
      <button onClick={reset} className="btn">
        Try again
      </button>
    </main>
  );
}
