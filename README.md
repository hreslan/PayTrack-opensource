# PayTrack

PayTrack is a self-hostable web app for tracking Australian payslips, other
income, work-related deductions, and estimating your tax return — without
handing your financial documents to a third party.

Upload a payslip PDF, check the figures PayTrack read from it, and the
original file is deleted. Only the numbers you confirm are kept.

## Features

- **Payslip upload & parsing** — drag in a PDF, review the extracted gross
  pay, tax, super and allowances, then confirm. The PDF itself is never
  stored: it's deleted the moment you confirm or cancel, and purged
  automatically within an hour regardless.
- **Deductions & other income** — track work expenses (with optional receipt
  scanning) and income outside your payslips (interest, dividends, side
  work), categorised for tax time.
- **Tax return estimate** — a live estimate for the current Australian
  financial year, based on resident tax rates, the Medicare levy and the low
  income tax offset.
- **Accountant export** — CSV downloads and a printable one-page report for
  handing to a tax agent or importing into accounting software.
- **Two-step verification** — optional 6-digit codes over email (or SMS, once
  a provider is configured) on top of password login.
- **Light & dark themes**, keyboard-accessible throughout.
- **Privacy by design** — see [the in-app privacy page](src/app/privacy/page.tsx)
  for exactly what is and isn't stored.

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Prisma](https://www.prisma.io/) — SQLite by default, Postgres-ready (see
  [DEPLOY.md](DEPLOY.md))
- [NextAuth](https://authjs.dev/) for authentication
- [Tailwind CSS v4](https://tailwindcss.com/) with a token-based design system
  (`src/app/globals.css`)
- Optional AI-assisted document parsing via the
  [Gemini API](https://aistudio.google.com/apikey) — a built-in pattern
  parser is used when no key is configured, so no document data has to leave
  the server

## Getting started

Requires Node.js 20+.

```bash
git clone <this-repo-url>
cd paytrack
npm install
cp .env.example .env   # fill in AUTH_SECRET at minimum — see comments in the file
npx prisma migrate deploy
npm run dev
```

The app runs at `http://localhost:3000`. Two-step verification codes print to
the server console until an email provider is configured in `.env`.

### Running the tests

```bash
npm test
```

### Building for production

```bash
npm run build
npm start
```

## Self-hosting

[DEPLOY.md](DEPLOY.md) walks through running PayTrack always-on on a spare
machine — as a system service, with a free HTTPS tunnel, no cloud database or
open router ports required.

## Project structure

```
src/app/          Next.js App Router pages (one route per financial feature)
src/components/   UI components — shared design tokens live in components/ui.ts
src/lib/          Server actions, auth, tax estimation, parsing, formatting
prisma/           Database schema and migrations
tests/            Unit tests (node:test)
```

## Contributing

Issues and pull requests are welcome. There's no formal process yet — open an
issue to discuss a change before sending a large PR.

## License

[MIT](LICENSE)
