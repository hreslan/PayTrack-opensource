"use client";

import { useActionState } from "react";
import Card from "./Card";
import Chip from "./Chip";
import PillButton from "./PillButton";
import {
  start2faSetup,
  confirm2faSetup,
  disable2fa,
  type TwoFactorState,
} from "@/lib/profile-actions";

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
          <PillButton type="submit" variant="secondary">
            Turn off two-step verification
          </PillButton>
        </form>
      ) : codeSent ? (
        <form action={confirmAction} className="mt-5 flex flex-col gap-4">
          <p className="text-sm text-ink">{startState?.sentInfo}</p>
          <label className="flex flex-col gap-1.5">
            <span className="pl-2 text-xs font-medium text-muted">
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
              className="w-full max-w-56 rounded-full border border-ink/10 bg-card px-5 py-3 text-center text-lg font-bold tracking-[0.4em] text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          {confirmState?.error && (
            <p role="alert" className="pl-2 text-sm font-medium text-accent">
              {confirmState.error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <PillButton type="submit" disabled={confirmPending} arrow>
              {confirmPending ? "Checking…" : "Turn on"}
            </PillButton>
            <PillButton
              type="submit"
              variant="tertiary"
              formAction={startAction}
              formNoValidate
              disabled={startPending}
            >
              {startPending ? "Sending…" : "Send a new code"}
            </PillButton>
          </div>
        </form>
      ) : (
        <form action={startAction} className="mt-5">
          {startState?.error && (
            <p role="alert" className="mb-3 pl-2 text-sm font-medium text-accent">
              {startState.error}
            </p>
          )}
          <PillButton type="submit" disabled={startPending} arrow>
            {startPending ? "Sending code…" : "Turn on two-step verification"}
          </PillButton>
        </form>
      )}
    </Card>
  );
}
