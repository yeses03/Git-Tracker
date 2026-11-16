import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-bold text-ink">Page not found</h1>
      <Link href="/" className="btn">
        Back to the leaderboard
      </Link>
    </main>
  );
}
