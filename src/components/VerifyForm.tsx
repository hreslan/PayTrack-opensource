"use client";

import { useActionState } from "react";
import PillButton from "./PillButton";
import type { AuthFormState } from "@/lib/auth-actions";

type Action = (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;

export default function VerifyForm({
  verifyAction,
  resendAction,
  cancelAction,
}: {
  verifyAction: Action;
  resendAction: Action;
  cancelAction: () => Promise<void>;
}) {
  const [state, formAction, pending] = useActionState(verifyAction, undefined);
  const [resendState, resendFormAction, resendPending] = useActionState(
    resendAction,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="pl-2 text-xs font-medium text-muted">6-digit code</span>
        <input
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          placeholder="000000"
          className="w-full rounded-full border border-ink/10 bg-card px-5 py-3 text-center text-lg font-bold tracking-[0.4em] text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      {state?.error && (
        <p role="alert" className="pl-2 text-sm font-medium text-accent">
          {state.error}
        </p>
      )}

      <PillButton type="submit" disabled={pending} arrow>
        {pending ? "Checking…" : "Verify & log in"}
      </PillButton>

      {resendState?.error && (
        <p role="alert" className="pl-2 text-sm font-medium text-accent">
          {resendState.error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          formAction={resendFormAction}
          formNoValidate
          disabled={resendPending}
          className="rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
        >
          {resendPending ? "Sending…" : "Send a new code"}
        </button>
        <button
          type="submit"
          formAction={cancelAction}
          formNoValidate
          className="rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Back to login
        </button>
      </div>
    </form>
  );
}
