export type UploadResult<T = unknown> = {
  ok: boolean;
  status: number;
  data: T | null;
};

// Uses XMLHttpRequest because fetch() cannot observe request body progress.
export function uploadWithProgress<T = unknown>(
  url: string,
  body: FormData,
  onProgress: (fraction: number) => void
): Promise<UploadResult<T>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && e.total > 0) onProgress(e.loaded / e.total);
    });
    xhr.upload.addEventListener("load", () => onProgress(1));
    xhr.addEventListener("load", () =>
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        data: (xhr.response as T) ?? null,
      })
    );
    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));
    xhr.send(body);
  });
}
