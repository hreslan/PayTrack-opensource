"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button from "./Button";
import type { AuthFormState } from "@/lib/auth-actions";
import { errorClasses, fieldClasses, inputClasses, labelClasses } from "./ui";

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
      <label className={fieldClasses}>
        <span className={labelClasses}>Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className={inputClasses}
        />
      </label>
      <label className={fieldClasses}>
        <span className={labelClasses}>Password</span>
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
        <p role="alert" className={errorClasses}>
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending
          ? "Please wait…"
          : mode === "login"
            ? "Log in"
            : "Create account"}
      </Button>

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
