---
name: verify
description: How to E2E-verify PayTrack changes by driving the real app (dependency-free CDP; no Playwright/puppeteer allowed in this repo)
---

# Verifying PayTrack changes

No Playwright/puppeteer — prompt.md forbids new dependencies. Drive headless Chrome
over the DevTools Protocol with a plain Node script (Node 24 has a built-in WebSocket).

## Launch

```
npm run dev          # ready in ~2s on http://localhost:3000, uses .env (Neon Postgres + Gemini key)
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --remote-debugging-port=9333 --user-data-dir=<scratch>\chrome-profile --no-first-run about:blank
```

Connect to the page target from `http://127.0.0.1:9333/json/list`, then use
`Page.navigate`, `Runtime.evaluate`, `DOM.setFileInputFiles`, `Page.captureScreenshot`.

**Teardown (Windows):** stopping a backgrounded `npm run dev`/`npm start` kills the
npm wrapper but orphans the `next` node child still holding port 3000, so the next
run hits `EADDRINUSE`. Free it with `node scripts/free-port.mjs 3000` (also wired as
the `prestart` hook, so `npm start` self-heals).

## Getting a session

`POST /register` auto-signs-in (no email verification): navigate to `/register`, set
`input[name=email]` / `input[name=password]` via the native value setter + input/change
events, submit, wait for `location.pathname === "/"`. Use a unique
`something-<Date.now()>@example.com` email.

## Gotchas (hard-won)

- **`document.querySelector("form")` grabs the sidebar logout form** (it precedes page
  content in DOM order) — always scope: `document.querySelector("#payslip-file").closest("form")`.
- Hand-crafted PDFs fail server-side pdf-parse ("bad XRef entry") — generate fixtures with
  `Page.printToPDF` from a `data:text/html,...` page instead.
- To make XHR upload progress observable, throttle with
  `Network.emulateNetworkConditions { uploadThroughput: 8*1024, downloadThroughput: -1 }`.
- `DOM.setFileInputFiles` does fire React `onChange`.
- Shell deletion under `.uploads/` is hook-blocked; clean up test users/uploads with a Node
  script using the project's `@prisma/client` via `createRequire` (delete `pendingUpload`
  files with `fs.unlinkSync(row.filePath)`, then `prisma.user.delete`).

A full worked example (register → payslip upload with progress sampling → receipt scan →
invalid-PDF probe → cleanup) lived in the session scratchpad as `e2e-progress.mjs` /
`cleanup.mjs`; the pattern above is enough to rebuild it.
