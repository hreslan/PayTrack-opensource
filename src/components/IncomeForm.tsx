"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Button from "./Button";
import { addOtherIncome, type IncomeFormState } from "@/lib/income-actions";
import { INCOME_CATEGORIES } from "@/lib/income-categories";
import { errorClasses, fieldClasses, inputClasses, labelClasses } from "./ui";


export default function IncomeForm() {
  const [state, formAction, pending] = useActionState<IncomeFormState, FormData>(
    addOtherIncome,
    undefined
  );
  // controlled so the fields can be cleared after a successful save
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [tax, setTax] = useState("");
  const [category, setCategory] = useState("");

  const savedRef = useRef(false);
  useEffect(() => {
    if (state?.saved && !savedRef.current) {
      savedRef.current = true;
      setDate("");
      setDescription("");
      setAmount("");
      setTax("");
      setCategory("");
    }
    if (!state?.saved) savedRef.current = false;
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={fieldClasses}>
          <span className={labelClasses}>Where it came from</span>
          <input
            name="description"
            type="text"
            required
            maxLength={120}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Savings account interest"
            className={inputClasses}
          />
        </label>
        <label className={fieldClasses}>
          <span className={labelClasses}>Category</span>
          <select
            name="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClasses}
          >
            <option value="" disabled>
              Pick a category…
            </option>
            {INCOME_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldClasses}>
          <span className={labelClasses}>Amount</span>
          <input
            name="amount"
            type="text"
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={inputClasses}
          />
        </label>
        <label className={fieldClasses}>
          <span className={labelClasses}>
            Date received (optional)
          </span>
          <input
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClasses}
          />
        </label>
        <label className={fieldClasses}>
          <span className={labelClasses}>
            Tax withheld (optional)
          </span>
          <input
            name="tax"
            type="text"
            inputMode="decimal"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
            placeholder="0.00"
            className={inputClasses}
          />
        </label>
      </div>

      {state?.error && (
        <p role="alert" className={errorClasses}>
          {state.error}
        </p>
      )}
      {state?.saved && (
        <p role="status" className="text-sm font-medium text-positive">
          Income saved.
        </p>
      )}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save income"}
        </Button>
      </div>
    </form>
  );
}
