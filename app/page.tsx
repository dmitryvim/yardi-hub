import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Yardi
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          A hub for games and fun. Play, compete, and track your scores.
        </p>
        <div className="flex gap-4">
          <Link
            href="/games"
            className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Browse Games
          </Link>
          {!session && (
            <Link
              href="/login"
              className="rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Login with Telegram
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
