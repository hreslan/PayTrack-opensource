"use client";

import { useActionState } from "react";
import Button from "./Button";
import Chip from "./Chip";
import type { ConfirmFormState } from "@/lib/payslip-actions";
import { errorClasses, fieldClasses, inputClasses } from "./ui";


export type ConfirmField = {
  name: string;
  title: string;
  type: "date" | "money";
  value: string; // "" when the parser found nothing
  matchedLabel: string | null;
};

export default function ConfirmForm({
  fields,
  confirmAction,
  cancelAction,
}: {
  fields: ConfirmField[];
  confirmAction: (
    prev: ConfirmFormState,
    formData: FormData
  ) => Promise<ConfirmFormState>;
  cancelAction: () => Promise<void>;
}) {
  const [state, formAction, pending] = useActionState(confirmAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className={fieldClasses}>
            <span className="flex items-center justify-between gap-2 pl-2">
              <span className="text-xs font-medium text-muted">{field.title}</span>
              {field.matchedLabel ? (
                <Chip className="!py-0.5 text-[11px]">
                  Found: {field.matchedLabel}
                </Chip>
              ) : (
                <span className="text-[11px] text-muted">not found</span>
              )}
            </span>
            <input
              name={field.name}
              type={field.type === "date" ? "date" : "text"}
              inputMode={field.type === "money" ? "decimal" : undefined}
              defaultValue={field.value}
              placeholder={field.type === "money" ? "0.00" : undefined}
              className={inputClasses}
            />
          </label>
        ))}
      </div>

      {state?.error && (
        <p role="alert" className={errorClasses}>
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Confirm & Save"}
        </Button>
        <Button
          variant="secondary"
          type="submit"
          formAction={cancelAction}
          formNoValidate
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
      <p className="text-xs text-muted">
        Confirm &amp; Save keeps only these numbers and permanently deletes the
        PDF. Cancel deletes the PDF and saves nothing.
      </p>
    </form>
  );
}
