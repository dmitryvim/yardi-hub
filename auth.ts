import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyTelegramHash, isTelegramAuthRecent } from "@/lib/telegram";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: "telegram",
      name: "Telegram",
      credentials: {
        id: { type: "text" },
        first_name: { type: "text" },
        last_name: { type: "text" },
        username: { type: "text" },
        photo_url: { type: "text" },
        auth_date: { type: "text" },
        hash: { type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.id || !credentials?.hash || !credentials?.auth_date) {
          return null;
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
          console.error("TELEGRAM_BOT_TOKEN is not set");
          return null;
        }

        const telegramData = {
          id: credentials.id as string,
          first_name: credentials.first_name as string,
          last_name: credentials.last_name as string | undefined,
          username: credentials.username as string | undefined,
          photo_url: credentials.photo_url as string | undefined,
          auth_date: credentials.auth_date as string,
          hash: credentials.hash as string,
        };

        if (!(await verifyTelegramHash(telegramData, botToken))) {
          console.error("Telegram hash verification failed");
          return null;
        }

        if (!isTelegramAuthRecent(telegramData.auth_date)) {
          console.error("Telegram auth data is too old");
          return null;
        }

        // Upsert user in database (dynamic import to avoid edge runtime issues)
        const { db } = await import("@/lib/db");
        const { users } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");

        const telegramId = BigInt(telegramData.id);
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, telegramId))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(users)
            .set({
              username: telegramData.username || null,
              firstName: telegramData.first_name,
              lastName: telegramData.last_name || null,
              photoUrl: telegramData.photo_url || null,
              updatedAt: new Date(),
            })
            .where(eq(users.telegramId, telegramId));
        } else {
          await db.insert(users).values({
            telegramId,
            username: telegramData.username || null,
            firstName: telegramData.first_name,
            lastName: telegramData.last_name || null,
            photoUrl: telegramData.photo_url || null,
          });
        }

        return {
          id: telegramData.id,
          telegramId: telegramData.id,
          username: telegramData.username,
          firstName: telegramData.first_name,
          lastName: telegramData.last_name,
          photoUrl: telegramData.photo_url,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.telegramId = user.telegramId;
        token.username = user.username;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.photoUrl = user.photoUrl;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.telegramId = token.telegramId;
      session.user.username = token.username;
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      session.user.photoUrl = token.photoUrl;
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
  },
});
