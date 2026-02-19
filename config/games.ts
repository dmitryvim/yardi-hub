import type { GameConfig } from "@/types/game";

export const GAMES: GameConfig[] = [
  {
    key: "dng",
    name: "Ducks & Geese",
    description:
      "A multiplayer tile game. Control a karatist, protect your geese from wolves, and survive!",
    icon: "/games/dng.svg",
    color: "#27ae60",
    multiplayer: true,
    tags: ["multiplayer", "action", "survival"],
    basePath: "/g/dng",
  },
];
