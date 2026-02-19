import { Suspense } from "react";
import { TelegramLoginButton } from "@/app/components/TelegramLoginButton";

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Login
        </h1>
        <p className="max-w-sm text-zinc-600 dark:text-zinc-400">
          Login to access games and track your scores.
        </p>
        <Suspense>
          <TelegramLoginButton />
        </Suspense>
      </div>
    </div>
  );
}
