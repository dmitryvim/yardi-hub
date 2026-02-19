import { auth } from "@/auth";

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    return null;
  }

  const { user } = session;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Profile
      </h1>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-4">
          {user.photoUrl && (
            <img
              src={user.photoUrl}
              alt=""
              className="h-16 w-16 rounded-full"
            />
          )}
          <div>
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              {user.firstName}
              {user.lastName ? ` ${user.lastName}` : ""}
            </p>
            {user.username && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                @{user.username}
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Telegram ID: {user.telegramId}
          </p>
        </div>
        <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Game stats will appear here in the future.
          </p>
        </div>
      </div>
    </div>
  );
}
