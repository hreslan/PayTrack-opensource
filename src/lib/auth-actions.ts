"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { signIn, DUMMY_HASH } from "./auth";
import {
  clearFailures,
  isLockedOut,
  rateLimit,
  recordFailure,
} from "./rate-limit";
import {
  CHALLENGE_COOKIE,
  CODE_TTL_MS,
  MAX_ATTEMPTS,
  RESEND_COOLDOWN_MS,
  codesMatch,
  issueCode,
} from "./otp";

export type AuthFormState = { error: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };
  if (Buffer.byteLength(password, "utf8") > 72)
    return { error: "Password is too long — the maximum is 72 characters." };

  const ip = (await headers()).get("x-forwarded-for") ?? "local";
  if (!rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
    return { error: "Too many new accounts from this device. Try again later." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists." };

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email, passwordHash } });

  await signIn("credentials", { email, password, redirectTo: "/" });
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Invalid email or password." };

  if (isLockedOut(`login:${email}`)) {
    return { error: "Too many failed attempts. Try again in 15 minutes." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Always run one bcrypt compare so unknown emails take as long as wrong passwords.
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    recordFailure(`login:${email}`);
    return { error: "Invalid email or password." };
  }
  clearFailures(`login:${email}`);

  if (user.twoFactorEnabled) {
    // Two-step login: park a challenge in an httpOnly cookie and ask for the code.
    const { token } = await issueCode(user, "login");
    const cookieStore = await cookies();
    cookieStore.set(CHALLENGE_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: CODE_TTL_MS / 1000,
      path: "/",
    });
    redirect("/verify");
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw err; // NEXT_REDIRECT on success
  }
}

async function currentChallenge() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CHALLENGE_COOKIE)?.value;
  if (!token) return null;
  const record = await prisma.verificationCode.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true, phone: true } } },
  });
  if (!record || record.purpose !== "login" || record.expiresAt < new Date()) {
    return null;
  }
  return record;
}

export async function verifyLoginAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const record = await currentChallenge();
  if (!record) redirect("/login");

  if (record.attempts >= MAX_ATTEMPTS) {
    return { error: "Too many attempts. Go back and log in again." };
  }

  const code = String(formData.get("code") ?? "").trim();
  if (!codesMatch(code, record.token, record.codeHash)) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { error: "That code is not right. Check it and try again." };
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { verified: true },
  });
  const cookieStore = await cookies();
  cookieStore.delete(CHALLENGE_COOKIE);

  try {
    await signIn("credentials", { challenge: record.token, redirectTo: "/" });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Could not complete the login. Please log in again." };
    }
    throw err;
  }
}

export async function resendLoginCodeAction(
  _prev: AuthFormState,
  _formData: FormData
): Promise<AuthFormState> {
  const record = await currentChallenge();
  if (!record) redirect("/login");

  if (Date.now() - record.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return { error: "Give it a minute before asking for another code." };
  }

  const { token } = await issueCode(record.user, "login");
  const cookieStore = await cookies();
  cookieStore.set(CHALLENGE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: CODE_TTL_MS / 1000,
    path: "/",
  });
  return undefined;
}

export async function cancelLoginAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CHALLENGE_COOKIE)?.value;
  if (token) {
    await prisma.verificationCode.deleteMany({ where: { token } });
    cookieStore.delete(CHALLENGE_COOKIE);
  }
  redirect("/login");
}
