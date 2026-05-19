import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

async function refreshAccessToken(token: any) {
  try {
    const url = "https://oauth2.googleapis.com/token";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: decrypt(token.refreshToken),
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    // Update database
    await prisma.account.update({
        where: { provider_providerAccountId: { provider: "google", providerAccountId: token.sub } },
        data: {
            accessToken: encrypt(refreshedTokens.access_token),
            expiresAt: new Date(Date.now() + refreshedTokens.expires_in * 1000),
            refreshToken: refreshedTokens.refresh_token ? encrypt(refreshedTokens.refresh_token) : undefined,
        }
    });

    return {
      ...token,
      accessToken: encrypt(refreshedTokens.access_token),
      expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ? encrypt(refreshedTokens.refresh_token) : token.refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing access token", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, user }) {
      if (account && user) {
        await prisma.user.upsert({
          where: { email: user.email! },
          update: {
            name: user.name,
            image: user.image,
          },
          create: {
            email: user.email!,
            name: user.name,
            image: user.image,
          },
        });

        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (dbUser) {
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            update: {
              accessToken: encrypt(account.access_token!),
              refreshToken: account.refresh_token ? encrypt(account.refresh_token) : undefined,
              expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
              scope: account.scope,
            },
            create: {
              userId: dbUser.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              accessToken: encrypt(account.access_token!),
              refreshToken: account.refresh_token ? encrypt(account.refresh_token) : undefined,
              expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
              tokenType: account.token_type,
              scope: account.scope,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        return {
          ...token,
          accessToken: encrypt(account.access_token!),
          refreshToken: account.refresh_token ? encrypt(account.refresh_token) : undefined,
          expiresAt: account.expires_at ? account.expires_at * 1000 : undefined,
        };
      }

      // If token is not expired, return it
      if (token.expiresAt && Date.now() < (token.expiresAt as number)) {
        return token;
      }

      // If expired, refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).error = token.error;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};
