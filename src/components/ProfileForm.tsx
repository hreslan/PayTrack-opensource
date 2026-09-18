"use client";

import { useActionState, useRef, useState } from "react";
import Button from "./Button";
import { updateProfile, type ProfileFormState } from "@/lib/profile-actions";
import { errorClasses, fieldClasses, inputClasses, labelClasses } from "./ui";


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
          <Button
            type="button"
            variant="tertiary"
            onClick={() => fileRef.current?.click()}
          >
            Choose photo
          </Button>
          {preview && (
            <button
              type="button"
              onClick={() => setAvatarField("__remove__")}
              className="rounded-control px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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

      <label className={fieldClasses}>
        <span className={labelClasses}>Display name</span>
        <input
          name="displayName"
          type="text"
          maxLength={40}
          defaultValue={initialName}
          placeholder={email.split("@")[0]}
          className={inputClasses}
        />
      </label>

      <label className={fieldClasses}>
        <span className={labelClasses}>
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

      <div className={fieldClasses}>
        <span className={labelClasses}>Email</span>
        <p className="rounded-control border border-line bg-inset px-3 py-2.5 text-sm text-muted">
          {email}
        </p>
      </div>

      {(state?.error || fileError) && (
        <p role="alert" className={errorClasses}>
          {state?.error ?? fileError}
        </p>
      )}
      {state?.saved && !fileError && (
        <p role="status" className="text-sm font-medium text-positive">
          Profile saved.
        </p>
      )}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
