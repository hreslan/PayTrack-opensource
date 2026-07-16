"use client";

import { useActionState } from "react";
import Link from "next/link";
import PillButton from "./PillButton";
import type { AuthFormState } from "@/lib/auth-actions";

export const inputClasses =
  "w-full rounded-full border border-ink/10 bg-card px-5 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent";

export default function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "register";
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="pl-2 text-xs font-medium text-muted">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className={inputClasses}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="pl-2 text-xs font-medium text-muted">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
          className={inputClasses}
        />
      </label>

      {state?.error && (
        <p role="alert" className="pl-2 text-sm font-medium text-accent">
          {state.error}
        </p>
      )}

      <PillButton type="submit" disabled={pending} arrow className="mt-2">
        {pending
          ? "Please wait…"
          : mode === "login"
            ? "Log in"
            : "Create account"}
      </PillButton>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link
              href="/register"
              className="font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Register
            </Link>
          </>
        ) : (
          <>
            Already registered?{" "}
            <Link
              href="/login"
              className="font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
