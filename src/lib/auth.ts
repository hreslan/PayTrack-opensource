import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import { clearFailures, isLockedOut, recordFailure } from "./rate-limit";

// A real (random) bcrypt hash used to equalize timing for unknown emails.
export const DUMMY_HASH = "$2b$12$F8Udfm4kubRP5ySQAiL8GeFRPC9L8R9lIxnGbRYtyh1vIqLIASQlC";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, challenge: {} },
      async authorize(credentials) {
        // Path 1: completing a two-step login with a verified challenge token.
        const challenge =
          typeof credentials?.challenge === "string" ? credentials.challenge : "";
        if (challenge) {
          const record = await prisma.verificationCode.findUnique({
            where: { token: challenge },
            include: { user: true },
          });
          if (
            !record ||
            record.purpose !== "login" ||
            !record.verified ||
            record.expiresAt < new Date()
          ) {
            return null;
          }
          // single use: burn every outstanding login code for this user
          await prisma.verificationCode.deleteMany({
            where: { userId: record.userId, purpose: "login" },
          });
          return { id: record.user.id, email: record.user.email };
        }

        // Path 2: plain email + password (only for accounts without 2FA —
        // enforcing this here means the auth API can't be used to skip it).
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        if (isLockedOut(`login:${email}`)) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // Always run one bcrypt compare so unknown emails take as long.
        const valid = await bcrypt.compare(
          password,
          user?.passwordHash ?? DUMMY_HASH
        );
        if (!user || !valid) {
          recordFailure(`login:${email}`);
          return null;
        }
        if (user.twoFactorEnabled) return null;

        clearFailures(`login:${email}`);
        return { id: user.id, email: user.email };
      },
    }),
  ],
});
