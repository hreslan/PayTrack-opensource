"use client";

import { useActionState } from "react";
import Card from "./Card";
import Chip from "./Chip";
import Button from "./Button";
import {
  start2faSetup,
  confirm2faSetup,
  disable2fa,
  type TwoFactorState,
} from "@/lib/profile-actions";
import { codeInputClasses, errorClasses, fieldClasses, labelClasses } from "./ui";

export default function TwoFactorCard({ enabled }: { enabled: boolean }) {
  const [startState, startAction, startPending] = useActionState<
    TwoFactorState,
    FormData
  >(start2faSetup, undefined);
  const [confirmState, confirmAction, confirmPending] = useActionState<
    TwoFactorState,
    FormData
  >(confirm2faSetup, undefined);

  const isEnabled = enabled || confirmState?.enabled === true;
  const codeSent = !isEnabled && startState?.sentInfo !== undefined;

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight text-ink">
          Two-step verification
        </h2>
        <Chip className={isEnabled ? "!border-accent text-accent" : ""}>
          {isEnabled ? "On" : "Off"}
        </Chip>
      </div>
      <p className="mt-1 text-sm text-muted">
        When it&apos;s on, logging in also asks for a 6-digit code sent to your
        email{" "}
        <span className="whitespace-nowrap">
          (and by SMS once an SMS provider is set up)
        </span>
        .
      </p>

      {isEnabled ? (
        <form action={disable2fa} className="mt-5">
          <Button type="submit" variant="secondary">
            Turn off two-step verification
          </Button>
        </form>
      ) : codeSent ? (
        <form action={confirmAction} className="mt-5 flex flex-col gap-4">
          <p className="text-sm text-ink">{startState?.sentInfo}</p>
          <label className={fieldClasses}>
            <span className={labelClasses}>
              Enter the code to finish turning it on
            </span>
            <input
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              placeholder="000000"
              className={`${codeInputClasses} max-w-56`}
            />
          </label>
          {confirmState?.error && (
            <p role="alert" className={errorClasses}>
              {confirmState.error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={confirmPending}>
              {confirmPending ? "Checking…" : "Turn on"}
            </Button>
            <Button
              type="submit"
              variant="tertiary"
              formAction={startAction}
              formNoValidate
              disabled={startPending}
            >
              {startPending ? "Sending…" : "Send a new code"}
            </Button>
          </div>
        </form>
      ) : (
        <form action={startAction} className="mt-5">
          {startState?.error && (
            <p role="alert" className={`mb-3 ${errorClasses}`}>
              {startState.error}
            </p>
          )}
          <Button type="submit" disabled={startPending}>
            {startPending ? "Sending code…" : "Turn on two-step verification"}
          </Button>
        </form>
      )}
    </Card>
  );
}
