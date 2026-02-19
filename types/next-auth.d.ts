import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    telegramId: string;
    username?: string;
    firstName: string;
    lastName?: string;
    photoUrl?: string;
  }

  interface Session {
    user: {
      id: string;
      telegramId: string;
      username?: string;
      firstName: string;
      lastName?: string;
      photoUrl?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    telegramId: string;
    username?: string;
    firstName: string;
    lastName?: string;
    photoUrl?: string;
  }
}
