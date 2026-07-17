"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PillButton from "./PillButton";
import UploadProgress, { useUploadProgress } from "./UploadProgress";

const MAX_SIZE = 10 * 1024 * 1024;

export default function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { progress, upload, reset } = useUploadProgress();

  function takeFile(f: File | undefined) {
    if (!f) return;
    setError(null);
    setFile(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Choose a PDF file to upload.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are accepted.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File is too large — the maximum is 10 MB.");
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await upload<{ id?: string; error?: string }>("/api/upload", body, {
        uploadLabel: "Uploading your payslip…",
        processingLabel: "Reading your payslip…",
      });
      if (!res.ok || !res.data?.id) {
        setError(res.data?.error ?? "Upload failed. Please try again.");
        reset();
        setBusy(false);
        return;
      }
      router.push(`/confirm/${res.data.id}`);
    } catch {
      setError("Upload failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <label
        htmlFor="payslip-file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          takeFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-card border border-dashed px-6 py-10 text-center transition-colors focus-within:border-accent ${
          dragOver
            ? "border-accent bg-accent-soft/40"
            : "border-ink/20 bg-surface hover:border-accent"
        }`}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 13V3m0 0L6 7m4-4 4 4M4 16.5h12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="text-sm font-semibold text-ink">
          {file?.name ?? "Choose a payslip PDF or drag it here"}
        </span>
        <span className="text-xs text-muted">PDF only, up to 10 MB</span>
        <input
          id="payslip-file"
          name="file"
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={(e) => takeFile(e.target.files?.[0])}
        />
      </label>

      {progress && <UploadProgress percent={progress.percent} label={progress.label} />}

      {error && (
        <p role="alert" className="text-sm font-medium text-accent">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <PillButton type="submit" disabled={busy} arrow>
          {busy ? "Uploading…" : "Upload payslip"}
        </PillButton>
        <PillButton variant="tertiary" href="/">
          Back to dashboard
        </PillButton>
      </div>
    </form>
  );
}
