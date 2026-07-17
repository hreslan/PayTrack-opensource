"use client";

import { useEffect, useRef, useState } from "react";
import { uploadWithProgress, type UploadResult } from "@/lib/upload-with-progress";

// The upload itself fills 0–80% of the bar; server-side parsing (the slow
// part) creeps the rest toward the ceiling until the response arrives.
const UPLOAD_SHARE = 80;
const CREEP_CEILING = 96;

type Progress = { percent: number; label: string };
type Labels = { uploadLabel: string; processingLabel: string };

export function useUploadProgress() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    },
    []
  );

  function stopCreep() {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function reset() {
    stopCreep();
    setProgress(null);
  }

  async function upload<T>(
    url: string,
    body: FormData,
    { uploadLabel, processingLabel }: Labels
  ): Promise<UploadResult<T>> {
    stopCreep();
    setProgress({ percent: 0, label: uploadLabel });
    try {
      const result = await uploadWithProgress<T>(url, body, (sent) => {
        if (sent >= 1) {
          setProgress({ percent: UPLOAD_SHARE, label: processingLabel });
          if (timerRef.current === null) {
            timerRef.current = setInterval(() => {
              setProgress((p) =>
                p ? { ...p, percent: p.percent + (CREEP_CEILING - p.percent) * 0.06 } : p
              );
            }, 350);
          }
        } else {
          setProgress({ percent: sent * UPLOAD_SHARE, label: uploadLabel });
        }
      });
      stopCreep();
      setProgress({ percent: 100, label: processingLabel });
      return result;
    } catch (err) {
      reset();
      throw err;
    }
  }

  return { progress, upload, reset };
}

export default function UploadProgress({ percent, label }: Progress) {
  const shown = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={shown}
      aria-label={label}
      className="flex flex-col gap-1.5"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-ink">{label}</span>
        <span className="text-xs tabular-nums text-muted">{shown}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-accent-soft">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${shown}%` }}
        />
      </div>
    </div>
  );
}
