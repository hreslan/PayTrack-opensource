# Self-hosting PayTrack on your own Windows laptop

This runs PayTrack always-on from a spare Windows laptop instead of a cloud
platform: **SQLite** stores the data locally (no external database), the app
runs as a **Windows service** (auto-starts, restarts on crash/reboot), and a
**Cloudflare Tunnel** makes it reachable from anywhere with free HTTPS —
without opening any port on your router.

## What you'll need

- The spare laptop: keep it plugged in, on Wi-Fi/Ethernet, with sleep disabled
  (Settings → System → Power & sleep → set "When plugged in, PC goes to
  sleep" to **Never**).
- A domain name you control. Cloudflare Tunnel needs one to give you a stable
  `https://` address — any registrar works (~$10–15/yr for a `.com`). Don't
  want to buy one? See [Alternative: no domain](#alternative-no-domain-ddns--port-forwarding)
  at the bottom instead of section 8.
- Administrator access on the laptop (for installing services).

---

## 1. Install prerequisites

- **Node.js** (LTS) — https://nodejs.org
- **Git** — https://git-scm.com

## 2. Get the code

```powershell
git clone https://github.com/vduck123/PayTrack.git
cd PayTrack
npm install
```

## 3. Configure the environment

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

Leave `AUTH_URL` commented out for now — you'll set it in step 9 once you
know the domain.

## 4. Create the database

```powershell
npx prisma migrate deploy
```

This creates `prisma/dev.db` with all the tables.

## 5. Build and do a local test run

```powershell
npm run build
npm start
```

Visit `http://localhost:3000` on the laptop, then `http://<laptop's LAN
IP>:3000` from your phone on the **same Wi-Fi** (find the IP with
`ipconfig`) to confirm the app works before exposing it further. Windows
Firewall may prompt the first time — allow access on Private networks.
Press `Ctrl+C` once confirmed.

## 6. Run it as a background Windows service

This keeps PayTrack running after you close the terminal, log out, or
reboot. [NSSM](https://nssm.cc/download) is the simplest way:

1. Download NSSM, extract `nssm.exe` (the `win64` build) somewhere like
   `C:\nssm\nssm.exe`.
2. In an **Administrator** PowerShell:

   ```powershell
   C:\nssm\nssm.exe install PayTrack "C:\Program Files\nodejs\npm.cmd" start
   C:\nssm\nssm.exe set PayTrack AppDirectory "C:\path\to\PayTrack"
   C:\nssm\nssm.exe set PayTrack Start SERVICE_AUTO_START
   C:\nssm\nssm.exe set PayTrack AppStdout "C:\path\to\PayTrack\logs\out.log"
   C:\nssm\nssm.exe set PayTrack AppStderr "C:\path\to\PayTrack\logs\err.log"
   C:\nssm\nssm.exe start PayTrack
   ```

   (replace `C:\path\to\PayTrack` with the actual clone location; create the
   `logs` folder first). NSSM restarts the app automatically if it ever
   crashes — no extra config needed.

Visit `http://localhost:3000` again to confirm the service is serving it.

## 7. Firewall

Nothing further needed for now — the Cloudflare Tunnel in the next step
makes an **outbound-only** connection, so no inbound firewall rule or router
change is required to reach the app from the internet.

## 8. Make it reachable from anywhere — Cloudflare Tunnel

Why a tunnel instead of port-forwarding: no router changes, works even if
your ISP doesn't give you a public IP (CGNAT), free automatic HTTPS, and your
home IP address is never exposed.

### 8.1 Add your domain to Cloudflare

1. In the [Cloudflare dashboard](https://dash.cloudflare.com), **Add a
   site**, enter your domain, choose the **Free** plan.
2. Cloudflare gives you two nameservers — set those at your domain
   registrar, replacing the existing ones.
3. Wait for the zone to show **Active** (usually minutes, can take longer).

### 8.2 Install cloudflared

```powershell
winget install --id Cloudflare.cloudflared -e
```

### 8.3 Create the tunnel

```powershell
cloudflared tunnel login
cloudflared tunnel create paytrack
```

The first command opens a browser to authorize against your domain; the
second creates a tunnel and a credentials file under
`%USERPROFILE%\.cloudflared\`.

### 8.4 Point a hostname at it

```powershell
cloudflared tunnel route dns paytrack paytrack.yourdomain.com
```

(swap in whichever subdomain you want, e.g. `app.yourdomain.com`).

### 8.5 Configure the tunnel

Create `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: paytrack
credentials-file: C:\Users\<you>\.cloudflared\<tunnel-id>.json
ingress:
  - hostname: paytrack.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

### 8.6 Test it

```powershell
cloudflared tunnel run paytrack
```

Visit `https://paytrack.yourdomain.com` from your **phone on mobile data**
(not your home Wi-Fi) to prove it's reachable from outside. `Ctrl+C` once
confirmed.

### 8.7 Install the tunnel as a service too

```powershell
cloudflared service install --config "%USERPROFILE%\.cloudflared\config.yml"
```

> **Gotcha:** without `--config` pointing at your user's `.cloudflared`
> folder, the service (which runs as `LocalSystem`) looks in the *system*
> profile instead and won't find your tunnel's config or credentials.

## 9. Point NextAuth at the real URL

Edit `.env`:

```
AUTH_URL="https://paytrack.yourdomain.com"
```

Then rebuild and restart so it takes effect:

```powershell
npm run build
C:\nssm\nssm.exe restart PayTrack
```

## 10. Verify from outside

On mobile data, visit `https://paytrack.yourdomain.com`, confirm the padlock
shows a valid certificate, and run through registering an account and
uploading a payslip.

---

## Keeping it running well

- **Backups.** `prisma/dev.db` is the entire database — one file. Periodically
  stop the service, copy it somewhere else, and restart:
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
  step 6). Cloudflared's service logs go to Windows Event Viewer under
  Application logs, source `cloudflared`.

## Alternative: no domain (DDNS + port forwarding)

If you'd rather not buy a domain: use a free dynamic DNS host (e.g.
[DuckDNS](https://www.duckdns.org)), forward your router's external ports 80
and 443 to the laptop, and run a reverse proxy such as
[Caddy](https://caddyserver.com) in front of PayTrack — Caddy auto-provisions
HTTPS certificates for your DDNS hostname. This is more moving parts and
exposes your router/home IP directly to the internet, so keep the laptop
patched and consider it a materially higher-risk setup than the tunnel above.
