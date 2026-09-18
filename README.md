# PayTrack

PayTrack tracks Australian payslips, other income and work-related
deductions, and estimates your tax return. It runs on your own machine, so
your financial documents never reach a third-party server.

Upload a payslip PDF and check the figures PayTrack read from it. Once you
confirm, the original file is deleted. Only the numbers you approved are
kept.

## Features

- **Payslip upload and parsing.** Drag in a PDF and review the extracted
  gross pay, tax, super and allowances before confirming. The PDF itself is
  never stored: it's deleted the moment you confirm or cancel, and anything
  left behind is purged automatically within an hour.
- **Deductions and other income.** Track work expenses, with optional
  receipt scanning, plus income outside your payslips such as interest,
  dividends or side work. Everything is categorised for tax time.
- **Tax return estimate.** A live estimate for the current Australian
  financial year, based on resident tax rates, the Medicare levy and the low
  income tax offset.
- **Accountant export.** CSV downloads and a printable one-page report, ready
  to hand to a tax agent or import into accounting software.
- **Two-step verification.** Optional 6-digit codes over email, or SMS once a
  provider is configured, on top of password login.
- **Light and dark themes**, keyboard-accessible throughout.
- **Privacy by design.** [The in-app privacy page](src/app/privacy/page.tsx)
  lists exactly what is and isn't stored.

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router), React 19, TypeScript
- [Prisma](https://www.prisma.io/): SQLite by default, Postgres-ready. See
  [DEPLOY.md](DEPLOY.md).
- [NextAuth](https://authjs.dev/) for authentication
- [Tailwind CSS v4](https://tailwindcss.com/) with a token-based design
  system in `src/app/globals.css`
- Optional AI-assisted document parsing via the
  [Gemini API](https://aistudio.google.com/apikey). Without a key, a
  built-in pattern parser handles documents instead, and no document data
  leaves the server.

## Getting started

Requires Node.js 20 or later.

```bash
git clone <this-repo-url>
cd paytrack
npm install
cp .env.example .env   # fill in AUTH_SECRET at minimum; see comments in the file
npx prisma migrate deploy
npm run dev
```

The app runs at `http://localhost:3000`. Until you configure an email
provider in `.env`, two-step verification codes print to the server console
instead of sending.

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

[DEPLOY.md](DEPLOY.md) covers running PayTrack always-on on a spare machine:
as a system service, reachable over a free HTTPS tunnel, with no cloud
database and no open router ports.

## Project structure

```
src/app/          Next.js App Router pages, one route per financial feature
src/components/   UI components; shared design tokens live in components/ui.ts
src/lib/          Server actions, auth, tax estimation, parsing, formatting
prisma/           Database schema and migrations
tests/            Unit tests (node:test)
```

## Contributing

Issues and pull requests are welcome. There's no formal process yet, so open
an issue to discuss a change before sending a large PR.

## License

[MIT](LICENSE)
