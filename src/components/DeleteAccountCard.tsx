"use client";

import { useActionState, useState } from "react";
import Card from "./Card";
import PillButton from "./PillButton";
import { deleteAccount, type DeleteAccountState } from "@/lib/profile-actions";

const inputClasses =
  "w-full max-w-72 rounded-full border border-ink/10 bg-card px-5 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-danger";

export default function DeleteAccountCard() {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState<DeleteAccountState, FormData>(
    deleteAccount,
    undefined
  );

  return (
    <Card className="mt-6 border border-danger/25">
      <h2 className="text-lg font-bold tracking-tight text-danger">Delete account</h2>
      <p className="mt-1 text-sm text-muted">
        Permanently deletes your account and everything in it — payslips,
        deductions and profile. This cannot be undone.
      </p>

      {!confirming ? (
        <div className="mt-5">
          <PillButton
            type="button"
            variant="danger"
            onClick={() => setConfirming(true)}
          >
            Delete account
          </PillButton>
        </div>
      ) : (
        <form action={formAction} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="pl-2 text-xs font-medium text-muted">
              Enter your password to confirm
            </span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Your password"
              className={inputClasses}
            />
          </label>

          {state?.error && (
            <p role="alert" className="pl-2 text-sm font-medium text-danger">
              {state.error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <PillButton type="submit" variant="danger" disabled={pending}>
              {pending ? "Deleting…" : "Permanently delete my account"}
            </PillButton>
            <PillButton
              type="button"
              variant="tertiary"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </PillButton>
          </div>
        </form>
      )}
    </Card>
  );
}
