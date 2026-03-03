import type { GameConfig } from "@/types/game";

export const GAMES: GameConfig[] = [
  {
    key: "tanki2",
    name: "Tanki 2",
    description:
      "Fast-paced 2D multiplayer tanks action game. Destroy opponents and climb the leaderboard!",
    icon: "/games/tanki2.svg",
    color: "#4a7c3f",
    multiplayer: true,
    tags: ["multiplayer", "action", "shooter", "pvp"],
    basePath: "/g/tanki2",
  },
  {
    key: "ducks-and-geese",
    name: "Ducks & Geese",
    description:
      "Multiplayer 2D karatist game. Protect your geese from wolves with a katana!",
    icon: "/games/ducks-and-geese.svg",
    color: "#e8a830",
    multiplayer: true,
    tags: ["multiplayer", "action", "survival"],
    basePath: "/g/ducks-and-geese",
  },
];
