import type { GameConfig } from "@/types/game";

export const GAMES: GameConfig[] = [
  {
    key: "tanki",
    name: "Tanki",
    description:
      "Fast-paced 2D multiplayer tanks action game. Destroy opponents and climb the leaderboard!",
    icon: "/games/tanki.svg",
    color: "#4a7c3f",
    multiplayer: true,
    tags: ["multiplayer", "action", "shooter", "pvp"],
    basePath: "/g/tanki",
  },
];
