"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import PillButton from "./PillButton";
import { addDeduction, type DeductionFormState } from "@/lib/deduction-actions";
import { DEDUCTION_CATEGORIES } from "@/lib/deduction-categories";

const inputClasses =
  "w-full rounded-full border border-ink/10 bg-card px-5 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent";

export default function DeductionForm() {
  const [state, formAction, pending] = useActionState<DeductionFormState, FormData>(
    addDeduction,
    undefined
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [scanning, setScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanNote, setScanNote] = useState<string | null>(null);
  // controlled values so a scanned receipt can prefill the fields
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  // after a successful save, clear the fields for the next entry
  const savedRef = useRef(false);
  useEffect(() => {
    if (state?.saved && !savedRef.current) {
      savedRef.current = true;
      setDate("");
      setDescription("");
      setAmount("");
      setScanNote(null);
    }
    if (!state?.saved) savedRef.current = false;
  }, [state]);

  async function scanFile(file: File | undefined) {
    if (!file) return;
    setScanError(null);
    setScanNote(null);
    setScanning(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/receipt", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setScanError(data?.error ?? "Could not read that receipt.");
        return;
      }
      if (data.date) setDate(data.date);
      if (data.item) setDescription(data.item);
      if (data.total !== null) setAmount((data.total / 100).toFixed(2));
      const found = [data.date && "date", data.item && "item", data.total !== null && "amount"]
        .filter(Boolean)
        .join(", ");
      setScanNote(
        found
          ? `Read from the receipt: ${found}. Check the details, pick a category, then save. The file itself was not kept.`
          : "Nothing could be read from that receipt — type the details in instead. The file was not kept."
      );
    } catch {
      setScanError("Could not read that receipt. Type the details in instead.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          scanFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex flex-wrap items-center gap-3 rounded-card border border-dashed px-4 py-4 transition-colors ${
          dragOver ? "border-accent bg-accent-soft/40" : "border-ink/20 bg-surface"
        }`}
      >
        <PillButton
          type="button"
          variant="tertiary"
          disabled={scanning}
          onClick={() => fileRef.current?.click()}
        >
          {scanning ? "Reading receipt…" : "Scan a receipt PDF"}
        </PillButton>
        <span className="text-xs text-muted">
          …or drag the receipt here. It&apos;s read and thrown away — only the
          details below are saved.
        </span>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          aria-label="Scan a receipt PDF"
          onChange={(e) => {
            scanFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {scanNote && <p className="pl-2 text-sm text-ink">{scanNote}</p>}
      {scanError && (
        <p role="alert" className="pl-2 text-sm font-medium text-accent">
          {scanError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="pl-2 text-xs font-medium text-muted">What it was</span>
          <input
            name="description"
            type="text"
            required
            maxLength={120}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Steel cap boots"
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="pl-2 text-xs font-medium text-muted">Category</span>
          <select name="category" required defaultValue="" className={inputClasses}>
            <option value="" disabled>
              Pick a category…
            </option>
            {DEDUCTION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="pl-2 text-xs font-medium text-muted">Amount</span>
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
        <label className="flex flex-col gap-1.5">
          <span className="pl-2 text-xs font-medium text-muted">Date (optional)</span>
          <input
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClasses}
          />
        </label>
      </div>

      {state?.error && (
        <p role="alert" className="pl-2 text-sm font-medium text-accent">
          {state.error}
        </p>
      )}
      {state?.saved && (
        <p role="status" className="pl-2 text-sm font-medium text-ink">
          Deduction saved.
        </p>
      )}

      <div>
        <PillButton type="submit" disabled={pending} arrow>
          {pending ? "Saving…" : "Save deduction"}
        </PillButton>
      </div>
    </form>
  );
}
