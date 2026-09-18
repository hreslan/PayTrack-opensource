"use client";

import { useActionState } from "react";
import Button from "./Button";
import type { AuthFormState } from "@/lib/auth-actions";
import { codeInputClasses, errorClasses, fieldClasses, labelClasses } from "./ui";

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
      <label className={fieldClasses}>
        <span className={labelClasses}>6-digit code</span>
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
          className={codeInputClasses}
        />
      </label>

      {state?.error && (
        <p role="alert" className={errorClasses}>
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Checking…" : "Verify & log in"}
      </Button>

      {resendState?.error && (
        <p role="alert" className={errorClasses}>
          {resendState.error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          formAction={resendFormAction}
          formNoValidate
          disabled={resendPending}
          className="rounded-control px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
        >
          {resendPending ? "Sending…" : "Send a new code"}
        </button>
        <button
          type="submit"
          formAction={cancelAction}
          formNoValidate
          className="rounded-control px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Back to login
        </button>
      </div>
    </form>
  );
}
