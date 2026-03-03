import { GAMES } from "@/config/games";

export default function GamesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Games
      </h1>
      {GAMES.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            No games available yet.
          </p>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game) => (
            <a
              key={game.key}
              href={game.basePath}
              className="block rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
            >
              <div className="flex items-center gap-3">
                {game.icon && (
                  <img src={game.icon} alt="" className="h-10 w-10 rounded" />
                )}
                <div>
                  <h2 className="font-medium text-zinc-900 dark:text-zinc-100">
                    {game.name}
                  </h2>
                  {game.tags.length > 0 && (
                    <div className="mt-0.5 flex gap-1">
                      {game.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-zinc-500 dark:text-zinc-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {game.description && (
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {game.description}
                </p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
