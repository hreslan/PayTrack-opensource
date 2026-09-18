# Self-hosting PayTrack on your own Windows laptop

This runs PayTrack always-on from a spare Windows laptop instead of a cloud
platform: **SQLite** stores the data locally (no external database), the app
runs as a **Windows service** (auto-starts, restarts on crash/reboot), and a
**Cloudflare Tunnel** makes it reachable from anywhere with free HTTPS —
without opening any port on your router.

Cloudflare Tunnel needs a domain whose nameservers point at Cloudflare. This
guide uses a **free eu.org subdomain** for that, since it (unlike DuckDNS,
FreeDNS, or is-a.dev) lets you delegate nameservers at registration time —
see [Why eu.org](#why-euorg-and-not-duckdns--freedns--is-adev) at the
bottom if you're curious. eu.org's review is manual and can take days to
weeks, so **start that application first** and do the laptop setup while you
wait.

## What you'll need

- The spare laptop: keep it plugged in, on Wi-Fi/Ethernet, with sleep disabled
  (Settings → System → Power & sleep → set "When plugged in, PC goes to
  sleep" to **Never**).
- Administrator access on the laptop (for installing services).

---

## 1. Apply for your eu.org domain (start this first — it's the slow part)

### 1.1 Pick a subdomain name
Something like `paytrack.eu.org` — first-come-first-served, so have a backup
name ready.

### 1.2 Add it to Cloudflare to get nameservers
1. Go to https://dash.cloudflare.com, sign up free if needed.
2. **Add a site** → enter your chosen name (e.g. `paytrack.eu.org`) → **Free**
   plan → Continue.
3. It scans for existing DNS and finds nothing — that's expected, continue.
4. Cloudflare shows **two nameservers** (e.g. `liz.ns.cloudflare.com`,
   `mark.ns.cloudflare.com`). Write these down — you need them next. The zone
   sits as "Pending Nameserver Update" until eu.org actually delegates it.

### 1.3 Apply at eu.org
1. Go to https://nic.eu.org/ and start a new subdomain application.
2. Enter your chosen name and select **Custom Nameservers**.
3. Enter the two Cloudflare nameservers from step 1.2.
4. Briefly describe what it's for (a personal, self-hosted finance app).
5. Submit.

### 1.4 Wait for approval
Reviewed manually by volunteers — check back over the next few days to a
couple of weeks. It's approved once the Cloudflare dashboard shows your zone
as **Active** instead of pending. Move on to section 2 while you wait.

---

## 2. Install prerequisites

- **Node.js** (LTS) — https://nodejs.org
- **Git** — https://git-scm.com

## 3. Get the code

```powershell
git clone https://github.com/vduck123/PayTrack.git
cd PayTrack
npm install
```

## 4. Configure the environment

```powershell
copy .env.example .env
```

Open `.env` and fill in:

| Variable | Value |
|---|---|
| `DATABASE_URL` | leave as `file:./dev.db` |
| `AUTH_SECRET` | generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `AUTH_TRUST_HOST` | leave as `true` |
| `EMAIL_SERVER_*` | optional — enables emailed sign-in codes (see the comments in the file) |
| `GEMINI_API_KEY` | optional — enables AI parsing of any payslip/receipt layout |

Leave `AUTH_URL` commented out for now — you'll set it in step 9 once your
eu.org domain is approved.

## 5. Create the database

```powershell
npx prisma migrate deploy
```

This creates `prisma/dev.db` with all the tables.

## 6. Build and do a local test run

```powershell
npm run build
npm start
```

Visit `http://localhost:3000` on the laptop, then `http://<laptop's LAN
IP>:3000` from your phone on the **same Wi-Fi** (find the IP with
`ipconfig`) to confirm the app works before exposing it further. Windows
Firewall may prompt the first time — allow access on Private networks.
Press `Ctrl+C` once confirmed.

## 7. Run it as a background Windows service

This keeps PayTrack running after you close the terminal, log out, or
reboot. [NSSM](https://nssm.cc/download) is the simplest way:

1. Download NSSM, extract `nssm.exe` (the `win64` build) somewhere like
   `C:\nssm\nssm.exe`.
2. In an **Administrator** PowerShell:

   ```powershell
   mkdir C:\PayTrack\logs
   C:\nssm\nssm.exe install PayTrack "C:\Program Files\nodejs\npm.cmd" start
   C:\nssm\nssm.exe set PayTrack AppDirectory "C:\path\to\PayTrack"
   C:\nssm\nssm.exe set PayTrack Start SERVICE_AUTO_START
   C:\nssm\nssm.exe set PayTrack AppStdout "C:\path\to\PayTrack\logs\out.log"
   C:\nssm\nssm.exe set PayTrack AppStderr "C:\path\to\PayTrack\logs\err.log"
   C:\nssm\nssm.exe start PayTrack
   ```

   (replace `C:\path\to\PayTrack` with the actual clone location). NSSM
   restarts the app automatically if it ever crashes — no extra config
   needed.

Visit `http://localhost:3000` again to confirm the service is serving it.
PayTrack is now fully running and reachable on your home network — everything
below makes it reachable from outside, once eu.org has approved your domain.

## 8. Once eu.org shows Active — set up the Cloudflare Tunnel

Check https://dash.cloudflare.com first: your zone must show **Active**, not
"Pending Nameserver Update." Don't proceed until it does.

Why a tunnel instead of port-forwarding: no router changes, works even if
your ISP doesn't give you a public IP (CGNAT), free automatic HTTPS, and your
home IP address is never exposed.

### 8.1 Install cloudflared

```powershell
winget install --id Cloudflare.cloudflared -e
```

### 8.2 Create the tunnel

```powershell
cloudflared tunnel login
cloudflared tunnel create paytrack
```

The first command opens a browser to authorize against your eu.org domain;
the second creates a tunnel and a credentials file under
`%USERPROFILE%\.cloudflared\`.

### 8.3 Point your domain at it

```powershell
cloudflared tunnel route dns paytrack paytrack.eu.org
```

(use your actual eu.org hostname).

### 8.4 Configure the tunnel

Create `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: paytrack
credentials-file: C:\Users\<you>\.cloudflared\<tunnel-id>.json
ingress:
  - hostname: paytrack.eu.org
    service: http://localhost:3000
  - service: http_status:404
```

(fill in your real username and the tunnel ID from step 8.2).

### 8.5 Test it

```powershell
cloudflared tunnel run paytrack
```

Visit `https://paytrack.eu.org` from your **phone on mobile data** (not your
home Wi-Fi) to prove it's reachable from outside. `Ctrl+C` once confirmed.

### 8.6 Install the tunnel as a service too

```powershell
cloudflared service install --config "%USERPROFILE%\.cloudflared\config.yml"
```

> **Gotcha:** without `--config` pointing at your user's `.cloudflared`
> folder, the service (which runs as `LocalSystem`) looks in the *system*
> profile instead and won't find your tunnel's config or credentials.

## 9. Point NextAuth at the real URL

Edit `.env`:

```
AUTH_URL="https://paytrack.eu.org"
```

Then rebuild and restart so it takes effect:

```powershell
npm run build
C:\nssm\nssm.exe restart PayTrack
```

## 10. Verify from outside

On mobile data, visit `https://paytrack.eu.org`, confirm the padlock shows a
valid certificate, and run through registering an account and uploading a
payslip.

---

## Keeping it running well

- **Backups.** `prisma/dev.db` is the database — one file. If users have kept
  copies of receipts, also back up the `.receipts/` folder alongside it (it
  holds the PDF files; the database only stores the paths). Periodically stop
  the service, copy both somewhere else, and restart:
  `nssm stop PayTrack` → copy → `nssm start PayTrack`.
- **Updating after code changes:**
  ```powershell
  git pull
  npm install
  npx prisma migrate deploy
  npm run build
  nssm restart PayTrack
  ```
- **Logs** live at `logs\out.log` / `logs\err.log` in the project folder (from
  step 7). Cloudflared's service logs go to Windows Event Viewer under
  Application logs, source `cloudflared`.

## Why eu.org, and not DuckDNS / FreeDNS / is-a.dev

Cloudflare Tunnel on the Free plan requires the *whole domain zone* to sit on
Cloudflare's nameservers ("Full Setup") — the CNAME-only alternative
("Partial Setup") is restricted to Cloudflare's Business plan ($200/mo).

- **DuckDNS / FreeDNS** only ever give you a record (A/CNAME) inside a zone
  they own — you can never move their nameservers, so Full Setup is
  impossible. They're documented as the [DDNS + port-forwarding
  alternative](#alternative-no-euorg-approval-yet--ddns--port-forwarding)
  below instead.
- **is-a.dev** *can* delegate nameservers to you, but not until your
  subdomain has existed 30+ days, and even then it needs maintainer approval
  (or a $2 donation to skip the justification step) — slower end-to-end than
  eu.org's single review, and it has no dynamic-IP-update API at all, so a
  changing home IP means submitting a new GitHub PR each time.
- **eu.org** lets you specify custom nameservers in the original
  application — one review, no waiting period beforehand.

## Alternative: no eu.org approval yet — DDNS + port forwarding

If you want PayTrack reachable from outside *before* eu.org approves your
domain: use a free dynamic DNS host (e.g. [DuckDNS](https://www.duckdns.org)
or [FreeDNS](https://freedns.afraid.org)), forward your router's external
ports 80 and 443 to the laptop, and run a reverse proxy such as
[Caddy](https://caddyserver.com) in front of PayTrack — Caddy auto-provisions
HTTPS certificates for your DDNS hostname. This is more moving parts and
exposes your router/home IP directly to the internet, so keep the laptop
patched and treat it as a materially higher-risk setup than the tunnel above,
and swap back to the eu.org + Tunnel path once your domain is approved.
