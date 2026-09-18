import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";
import { sendCode } from "./otp-delivery";

export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const CHALLENGE_COOKIE = "paytrack_2fa";

export function hashCode(code: string, token: string): string {
  return createHash("sha256").update(`${code}:${token}`).digest("hex");
}

export function codesMatch(code: string, token: string, storedHash: string): boolean {
  const a = Buffer.from(hashCode(code.trim(), token), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Creates a verification code for the user, delivers it, and returns the
 * challenge token plus the channels it went out on. Replaces any previous
 * code for the same purpose.
 */
export async function issueCode(
  user: { id: string; email: string; phone: string | null },
  purpose: "login" | "enable"
): Promise<{ token: string; channels: string }> {
  await prisma.verificationCode.deleteMany({
    where: {
      userId: user.id,
      OR: [{ purpose }, { expiresAt: { lt: new Date() } }],
    },
  });

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const token = randomBytes(32).toString("hex");
  const channels = await sendCode(user, code);

  await prisma.verificationCode.create({
    data: {
      userId: user.id,
      token,
      codeHash: hashCode(code, token),
      purpose,
      channels,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  return { token, channels };
}

/** "jane.doe@example.com" → "ja•••@example.com" */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}•••@${domain}`;
}

export function describeChannels(channels: string, email: string): string {
  const list = channels.split(",");
  if (list.includes("email") && list.includes("sms")) {
    return `We sent a 6-digit code to ${maskEmail(email)} and your phone.`;
  }
  if (list.includes("email")) {
    return `We sent a 6-digit code to ${maskEmail(email)}.`;
  }
  if (list.includes("sms")) {
    return "We sent a 6-digit code to your phone.";
  }
  return "No email or SMS service is set up yet, so the code was printed in the server terminal (the window running npm run dev).";
}
