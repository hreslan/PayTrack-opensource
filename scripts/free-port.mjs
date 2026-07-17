// Frees a TCP port before the server boots, so a leftover process (e.g. an
// orphaned `next dev`) never causes EADDRINUSE. Cross-platform, no deps.
//
// Runs as an npm pre-script, so it ALWAYS exits 0 — even when the port is
// already free or a lookup tool is missing — otherwise it would abort the very
// command it is meant to help (`npm start` skips `start` if `prestart` fails).
//
//   node scripts/free-port.mjs [port]   (default 3000)
import { execSync } from "node:child_process";

const port = Number(process.argv[2]) || 3000;

function pidsOnPort() {
  try {
    if (process.platform === "win32") {
      const out = execSync("netstat -ano -p TCP", { encoding: "utf8" });
      const pids = new Set();
      for (const line of out.split("\n")) {
        // columns: Proto  Local-Address  Foreign-Address  State  PID
        const p = line.trim().split(/\s+/);
        if (p.length >= 5 && p[3] === "LISTENING" && p[1].endsWith(`:${port}`)) {
          pids.add(p[p.length - 1]);
        }
      }
      return [...pids];
    }
    // macOS / Linux
    const out = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: "utf8" });
    return out.split("\n").map((s) => s.trim()).filter(Boolean);
  } catch {
    return []; // nothing listening, or the lookup tool isn't installed
  }
}

for (const pid of pidsOnPort()) {
  try {
    if (process.platform === "win32") execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
    else execSync(`kill -9 ${pid}`);
    console.log(`free-port: freed :${port} (stopped pid ${pid})`);
  } catch {
    // process already gone, or not ours to kill — leave it for the server to report
  }
}
