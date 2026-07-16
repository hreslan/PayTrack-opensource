"use client";

import { useActionState, useRef, useState } from "react";
import PillButton from "./PillButton";
import { updateProfile, type ProfileFormState } from "@/lib/profile-actions";

const inputClasses =
  "w-full rounded-full border border-ink/10 bg-card px-5 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent";

/** Centre-crop to a square and resize to 256px so avatars stay small. */
async function fileToAvatar(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    256,
    256
  );
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function ProfileForm({
  initialName,
  initialAvatar,
  initialPhone,
  email,
}: {
  initialName: string;
  initialAvatar: string | null;
  initialPhone: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    undefined
  );
  const fileRef = useRef<HTMLInputElement>(null);
  // "__keep__" = untouched, "__remove__" = cleared, otherwise a new data URL
  const [avatarField, setAvatarField] = useState("__keep__");
  const [fileError, setFileError] = useState<string | null>(null);

  const preview =
    avatarField === "__keep__"
      ? initialAvatar
      : avatarField === "__remove__"
        ? null
        : avatarField;
  const fallbackInitial = (initialName || email)[0]?.toUpperCase();

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileError(null);
    if (!file.type.startsWith("image/")) {
      setFileError("Choose an image file (JPG, PNG or WebP).");
      return;
    }
    try {
      setAvatarField(await fileToAvatar(file));
    } catch {
      setFileError("That image could not be read. Try a different photo.");
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-5">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Profile picture preview"
            className="size-24 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-24 items-center justify-center rounded-full bg-accent-soft text-3xl font-bold text-accent">
            {fallbackInitial}
          </span>
        )}
        <div className="flex flex-wrap gap-3">
          <PillButton
            type="button"
            variant="tertiary"
            onClick={() => fileRef.current?.click()}
          >
            Choose photo
          </PillButton>
          {preview && (
            <button
              type="button"
              onClick={() => setAvatarField("__remove__")}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Remove photo
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Choose profile picture"
          onChange={onFileChange}
        />
        <input type="hidden" name="avatar" value={avatarField} />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="pl-2 text-xs font-medium text-muted">Display name</span>
        <input
          name="displayName"
          type="text"
          maxLength={40}
          defaultValue={initialName}
          placeholder={email.split("@")[0]}
          className={inputClasses}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="pl-2 text-xs font-medium text-muted">
          Phone number (for SMS codes, once an SMS provider is set up)
        </span>
        <input
          name="phone"
          type="tel"
          defaultValue={initialPhone}
          placeholder="+61 4xx xxx xxx"
          className={inputClasses}
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="pl-2 text-xs font-medium text-muted">Email</span>
        <p className="rounded-full border border-ink/5 bg-surface px-5 py-3 text-sm text-muted">
          {email}
        </p>
      </div>

      {(state?.error || fileError) && (
        <p role="alert" className="pl-2 text-sm font-medium text-accent">
          {state?.error ?? fileError}
        </p>
      )}
      {state?.saved && !fileError && (
        <p role="status" className="pl-2 text-sm font-medium text-ink">
          Profile saved.
        </p>
      )}

      <div>
        <PillButton type="submit" disabled={pending} arrow>
          {pending ? "Saving…" : "Save changes"}
        </PillButton>
      </div>
    </form>
  );
}
