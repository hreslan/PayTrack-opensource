"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Button from "./Button";
import UploadProgress, { useUploadProgress } from "./UploadProgress";
import { addDeduction, type DeductionFormState } from "@/lib/deduction-actions";
import { DEDUCTION_CATEGORIES } from "@/lib/deduction-categories";
import { errorClasses, fieldClasses, inputClasses, labelClasses } from "./ui";

type ReceiptScan = {
  date: string | null;
  item: string | null;
  total: number | null;
  category: string | null;
  error?: string;
};


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
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [keepReceipt, setKeepReceipt] = useState(false);
  const { progress, upload, reset } = useUploadProgress();
  // controlled values so a scanned receipt can prefill the fields
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  // after a successful save, clear the fields for the next entry
  const savedRef = useRef(false);
  useEffect(() => {
    if (state?.saved && !savedRef.current) {
      savedRef.current = true;
      setDate("");
      setDescription("");
      setAmount("");
      setCategory("");
      setScanNote(null);
      setReceiptFileName(null);
      setKeepReceipt(false);
      if (fileRef.current) fileRef.current.value = "";
    }
    if (!state?.saved) savedRef.current = false;
  }, [state]);

  // Drag-dropped files aren't tied to the file input's own FileList, so sync
  // them in manually — this is what makes the file part of the form
  // submission if "Keep a copy" ends up checked.
  function attachDroppedFile(file: File) {
    if (fileRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileRef.current.files = dt.files;
    }
    setReceiptFileName(file.name);
  }

  async function scanFile(file: File | undefined) {
    if (!file) return;
    setScanError(null);
    setScanNote(null);
    setScanning(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await upload<ReceiptScan>("/api/receipt", body, {
        uploadLabel: "Uploading receipt…",
        processingLabel: "Reading receipt…",
      });
      const data = res.data;
      if (!res.ok || !data) {
        setScanError(data?.error ?? "Could not read that receipt.");
        return;
      }
      if (data.date) setDate(data.date);
      if (data.item) setDescription(data.item);
      if (data.total !== null) setAmount((data.total / 100).toFixed(2));
      if (data.category) setCategory(data.category);
      const found = [
        data.date && "date",
        data.item && "item",
        data.total !== null && "amount",
        data.category && "category",
      ]
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
      reset();
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
          const file = e.dataTransfer.files?.[0];
          if (file) attachDroppedFile(file);
          scanFile(file);
        }}
        className={`flex flex-wrap items-center gap-3 rounded-control border border-dashed px-4 py-4 transition-colors ${
          dragOver ? "border-accent bg-accent-soft" : "border-line-strong bg-inset"
        }`}
      >
        <Button
          type="button"
          variant="tertiary"
          disabled={scanning}
          onClick={() => fileRef.current?.click()}
        >
          {scanning ? "Reading receipt…" : "Scan a receipt PDF"}
        </Button>
        <span className="text-xs text-muted">
          …or drag the receipt here. We read it to fill in the fields below,
          then discard it — unless you keep a copy.
        </span>
        <input
          ref={fileRef}
          name="receipt"
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          aria-label="Scan a receipt PDF"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setReceiptFileName(file.name);
            scanFile(file);
          }}
        />
      </div>

      {receiptFileName && (
        <label className="flex items-center gap-2 pl-2 text-sm text-ink">
          <input
            type="checkbox"
            name="keepReceipt"
            value="1"
            checked={keepReceipt}
            onChange={(e) => setKeepReceipt(e.target.checked)}
            className="size-4 rounded border-line-strong accent-accent"
          />
          Keep a copy of &ldquo;{receiptFileName}&rdquo; so I can download it
          later
        </label>
      )}

      {progress && (
        <div className="px-2">
          <UploadProgress percent={progress.percent} label={progress.label} />
        </div>
      )}

      {scanNote && <p className="pl-2 text-sm text-ink">{scanNote}</p>}
      {scanError && (
        <p role="alert" className={errorClasses}>
          {scanError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={fieldClasses}>
          <span className={labelClasses}>What it was</span>
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
            {DEDUCTION_CATEGORIES.map((c) => (
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
          <span className={labelClasses}>Date (optional)</span>
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
        <p role="alert" className={errorClasses}>
          {state.error}
        </p>
      )}
      {state?.saved && (
        <p role="status" className="text-sm font-medium text-positive">
          Deduction saved.
        </p>
      )}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save deduction"}
        </Button>
      </div>
    </form>
  );
}
