import { execFile } from "node:child_process";
import path from "node:path";

// Parses untrusted PDFs in a separate node process with a hard timeout, so a
// crafted PDF can spin its own process, not the server: on expiry the child
// is killed and the request fails cleanly.

const PARSE_TIMEOUT_MS = 15_000;

const CHILD_SCRIPT = `
// pdf.js logs parse warnings via console.log; keep stdout JSON-only by
// sending all console output to stderr instead.
const write = process.stdout.write.bind(process.stdout);
for (const m of ["log", "info", "warn", "error"]) {
  console[m] = (...a) => process.stderr.write(a.join(" ") + "\\n");
}
const chunks = [];
process.stdin.on("data", (c) => chunks.push(c));
process.stdin.on("end", () => {
  const pdfPath = process.argv[1];
  const pdfParse = require(pdfPath);
  pdfParse(Buffer.concat(chunks))
    .then((d) => write(JSON.stringify({ text: d.text })))
    .catch((e) => write(JSON.stringify({ error: String((e && e.message) || e) })));
});
`;

export function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParsePath = path.join(
    process.cwd(),
    "node_modules",
    "pdf-parse",
    "lib",
    "pdf-parse.js"
  );

  return new Promise((resolve, reject) => {
    const child = execFile(
      process.execPath,
      ["-e", CHILD_SCRIPT, pdfParsePath],
      { timeout: PARSE_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024, windowsHide: true },
      (err, stdout) => {
        if (err) {
          reject(new Error("PDF parsing failed or timed out"));
          return;
        }
        try {
          const result = JSON.parse(stdout) as { text?: string; error?: string };
          if (typeof result.text === "string") resolve(result.text);
          else reject(new Error(result.error ?? "PDF parsing failed"));
        } catch {
          reject(new Error("PDF parser returned unexpected output"));
        }
      }
    );
    child.stdin?.on("error", () => {}); // child may die before stdin is consumed
    child.stdin?.end(buffer);
  });
}
