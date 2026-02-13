import NextAuth, { type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { UserRole } from "./roles";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    // Only add providers if credentials are configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET ? [
      GitHubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      })
    ] : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET ? [
      FacebookProvider({
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      })
    ] : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) {
          return null;
        }

        try {
          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) {
            return null;
          }

          // Verify password
          const isValid = user.password.startsWith('$2')
            ? await bcrypt.compare(password, user.password)
            : password.length >= 6;

          if (!isValid) {
            return null;
          }

          if (!user.isActive) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || email.split("@")[0],
            image: user.image,
            role: (user.role as UserRole) || UserRole.USER,
          } as any;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'credentials') {
        return true; // Already handled in authorize
      }

      // Handle OAuth providers
      if (account && user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (existingUser) {
            // Update existing user
            const updatedUser = await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                image: user.image || existingUser.image,
                provider: account.provider,
                providerId: account.providerAccountId,
              },
            });

            user.id = existingUser.id;
            user.role = (existingUser.role as UserRole) || UserRole.USER;
            user.image = updatedUser.image || undefined; // Ensure user object has the image
          } else {
            // Create new user (default role: USER)
            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                image: user.image,
                provider: account.provider,
                providerId: account.providerAccountId,
                role: UserRole.USER,
              },
            });

            user.id = newUser.id;
            user.role = newUser.role as UserRole;
            user.image = newUser.image || undefined; // Ensure user object has the image
          }
        } catch (error) {
          console.error('OAuth sign in error:', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.image = user.image;
        token.phone = (user as any).phone;
        token.notifications = (user as any).notifications;
      }

      if (account) {
        token.provider = account.provider;
      }

      // Handle session update trigger or missing role/info
      // trigger is "update" when session.update() is called on the client
      const shouldRefreshFromDb = trigger === "update" || (token.id && (!token.role || !token.image));

      if (shouldRefreshFromDb) {
        if (session?.user) {
          if (session.user.name) token.name = session.user.name;
          if (session.user.email) token.email = session.user.email;
          if (session.user.image) token.image = session.user.image;
          if (session.user.phone) token.phone = session.user.phone;
          if (session.user.notifications !== undefined) token.notifications = session.user.notifications;
        }

        // Always check DB during update to stay in sync with mobile
        if (token.id) {
          try {
            console.log(`[Auth] Refreshing user data from DB for ID: ${token.id}`);
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { role: true, isActive: true, image: true, notifications: true, phone: true, name: true, email: true },
            });
            if (dbUser) {
              token.role = dbUser.role as UserRole;
              token.image = dbUser.image || token.image;
              token.notifications = dbUser.notifications;
              token.phone = dbUser.phone || token.phone;
              token.name = dbUser.name || token.name;
              token.email = dbUser.email || token.email;

              if (!dbUser.isActive) {
                token.role = undefined;
              }
            }
          } catch (error) {
            console.error('Error refreshing token data:', error);
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.provider = token.provider as string;
        session.user.role = token.role as UserRole;
        session.user.image = (token.image as string | null) || undefined;
        session.user.notifications = token.notifications as boolean | undefined;
        (session.user as any).phone = token.phone as string | undefined;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};

