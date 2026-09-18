"use client";

import { useActionState, useState } from "react";
import Card from "./Card";
import Button from "./Button";
import { deleteAccount, type DeleteAccountState } from "@/lib/profile-actions";
import { errorClasses, fieldClasses, inputClasses, labelClasses } from "./ui";

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
          <Button
            type="button"
            variant="danger"
            onClick={() => setConfirming(true)}
          >
            Delete account
          </Button>
        </div>
      ) : (
        <form action={formAction} className="mt-5 flex flex-col gap-4">
          <label className={fieldClasses}>
            <span className={labelClasses}>
              Enter your password to confirm
            </span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Your password"
              className={`${inputClasses} max-w-72 focus:border-danger focus:ring-danger/25`}
            />
          </label>

          {state?.error && (
            <p role="alert" className={errorClasses}>
              {state.error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="danger" disabled={pending}>
              {pending ? "Deleting…" : "Permanently delete my account"}
            </Button>
            <Button
              type="button"
              variant="tertiary"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
