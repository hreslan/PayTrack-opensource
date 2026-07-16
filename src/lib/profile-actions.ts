"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signOut } from "./auth";
import { prisma } from "./prisma";
import { MAX_ATTEMPTS, codesMatch, describeChannels, issueCode } from "./otp";
import { deliveryConfigured } from "./otp-delivery";
import { removeFileQuietly } from "./uploads";

export type ProfileFormState = { error?: string; saved?: boolean } | undefined;

// Client resizes to 256px JPEG, so anything near this limit isn't a real avatar.
const MAX_AVATAR_LENGTH = 600_000;
const DATA_URL_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const displayName = String(formData.get("displayName") ?? "").trim();
  if (displayName.length > 40) {
    return { error: "Display name can be at most 40 characters." };
  }

  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const phone = phoneRaw.replace(/[\s()-]/g, "");
  if (phone && !/^\+?\d{7,15}$/.test(phone)) {
    return { error: "Enter the phone number in international format, e.g. +61 4xx xxx xxx." };
  }

  const avatarField = String(formData.get("avatar") ?? "__keep__");
  const data: {
    displayName: string | null;
    phone: string | null;
    avatar?: string | null;
  } = {
    displayName: displayName || null,
    phone: phone || null,
  };

  if (avatarField === "__remove__") {
    data.avatar = null;
  } else if (avatarField !== "__keep__") {
    if (avatarField.length > MAX_AVATAR_LENGTH || !DATA_URL_RE.test(avatarField)) {
      return { error: "That image could not be used. Try a different photo." };
    }
    data.avatar = avatarField;
  }

  await prisma.user.update({ where: { id: session.user.id }, data });

  revalidatePath("/", "layout");
  return { saved: true };
}

// ---- two-step verification ----

export type TwoFactorState =
  | { error?: string; sentInfo?: string; enabled?: boolean }
  | undefined;

export async function start2faSetup(
  _prev: TwoFactorState,
  _formData: FormData
): Promise<TwoFactorState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, phone: true },
  });
  if (!user) redirect("/login");

  // In production, refuse to enable 2FA that could only deliver codes to the
  // server console — that would be a false sense of security.
  if (process.env.NODE_ENV === "production" && !deliveryConfigured(user.phone)) {
    return {
      error:
        "Set up email delivery first (EMAIL_* settings in .env), otherwise codes would only appear in the server terminal.",
    };
  }

  const { channels } = await issueCode(user, "enable");
  return { sentInfo: describeChannels(channels, user.email) };
}

export async function confirm2faSetup(
  prev: TwoFactorState,
  formData: FormData
): Promise<TwoFactorState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const record = await prisma.verificationCode.findFirst({
    where: { userId: session.user.id, purpose: "enable" },
    orderBy: { createdAt: "desc" },
  });
  if (!record || record.expiresAt < new Date()) {
    return { error: "That code has expired. Start again to get a new one." };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    return { error: "Too many attempts. Start again to get a new code." };
  }

  const code = String(formData.get("code") ?? "").trim();
  if (!codesMatch(code, record.token, record.codeHash)) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ...prev, error: "That code is not right. Check it and try again." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: true },
  });
  await prisma.verificationCode.deleteMany({
    where: { userId: session.user.id },
  });

  revalidatePath("/profile");
  return { enabled: true };
}

export type DeleteAccountState = { error: string } | undefined;

export async function deleteAccount(
  _prev: DeleteAccountState,
  formData: FormData
): Promise<DeleteAccountState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  // Require the password again — deletion is permanent and irreversible.
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: "That password is not correct." };

  // Remove any temp PDF files still on disk before the rows cascade away.
  const pending = await prisma.pendingUpload.findMany({
    where: { userId: user.id },
    select: { filePath: true },
  });
  for (const p of pending) await removeFileQuietly(p.filePath);

  // Cascades to payslips, deductions, pending uploads and verification codes.
  await prisma.user.delete({ where: { id: user.id } });

  await signOut({ redirectTo: "/register" });
}

export async function disable2fa(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: false },
  });
  await prisma.verificationCode.deleteMany({
    where: { userId: session.user.id },
  });

  revalidatePath("/profile");
}
