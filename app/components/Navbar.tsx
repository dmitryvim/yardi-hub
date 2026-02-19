"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            Yardi
          </Link>
          <Link
            href="/games"
            className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Games
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {session.user.photoUrl && (
                  <img
                    src={session.user.photoUrl}
                    alt=""
                    className="h-6 w-6 rounded-full"
                  />
                )}
                {session.user.firstName}
              </Link>
              <button
                onClick={() => signOut()}
                className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
