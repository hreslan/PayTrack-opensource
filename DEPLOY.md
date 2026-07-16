# Deploying PayTrack 24/7 for free (Vercel + Neon)

This hosts the app always-on at no cost: **Vercel** runs the Next.js app and
**Neon** provides a free Postgres database. No credit card required.

The app was switched from a local SQLite file to Postgres for this. Your old
local data in `dev.db` does **not** move automatically — the hosted app starts
empty and you register again on it. (Ask if you want the old data migrated.)

---

## 1. Create the database (Neon)

1. Go to https://neon.tech and sign up (free).
2. Create a project (any name, closest region).
3. Open **Connection string** and copy **two** strings:
   - **Pooled** — the host contains `-pooler`. This is your `DATABASE_URL`.
   - **Direct** — the same without `-pooler`. This is your `DIRECT_URL`.
   Keep the `?sslmode=require` on the end of each.

## 2. Put the code on GitHub

From the project folder:

```bash
git add -A
git commit -m "Prepare for Vercel + Neon deployment"
```

Then create an empty repo at https://github.com/new and push (replace URL):

```bash
git remote add origin https://github.com/YOURNAME/paytrack.git
git branch -M main
git push -u origin main
```

`.env` and `dev.db` are git-ignored, so your secrets and local data are **not**
uploaded.

## 3. Deploy on Vercel

1. Go to https://vercel.com and sign up with your GitHub account (free).
2. **Add New → Project** and import the `paytrack` repo.
3. Before clicking Deploy, open **Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | the **pooled** Neon string |
   | `DIRECT_URL` | the **direct** Neon string |
   | `AUTH_SECRET` | a random 32-byte hex — run `openssl rand -hex 32` |
   | `AUTH_TRUST_HOST` | `true` |

   Optional (only if you use these features), copy them from your local `.env`:
   `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`,
   `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM`, `DEEPSEEK_API_KEY`,
   `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL`.

4. Click **Deploy**. Vercel runs `vercel-build`, which creates the database
   tables (`prisma migrate deploy`) and builds the app.

When it finishes you get a public URL like `https://paytrack-xxxx.vercel.app`
that stays online 24/7. Open it and register.

## 4. Later changes

Every `git push` to `main` redeploys automatically.

---

## Notes

- **Free limits:** Vercel Hobby and Neon free tiers are ample for personal use.
  Neon may pause an idle database; the next visit wakes it in ~1 second.
- **2FA email:** if you turn on two-step verification, the email variables must
  be set in Vercel or codes will only appear in the server logs. Gmail app
  passwords work (see `.env.example`).
- **Uploaded PDFs:** stored only in the server's temp dir during review and
  deleted on confirm/cancel — nothing to configure.
- **Running locally after this change:** put the Neon `DATABASE_URL` and
  `DIRECT_URL` in a local `.env` (see `.env.example`), then `npm run dev`.
