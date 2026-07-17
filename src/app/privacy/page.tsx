import Link from "next/link";
import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";

export const metadata: Metadata = {
  title: "Privacy & your data — PayTrack",
  description:
    "How PayTrack handles your payslips, receipts and account data — what is stored, what is deleted, and the controls you have.",
};

// Shown as the contact point at the foot of the policy. Replace with the
// address you want privacy enquiries to reach.
const CONTACT_EMAIL = "privacy@paytrack.app";
const LAST_UPDATED = "18 July 2026";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="scroll-mt-6">
      <h2 id={id} className="text-lg font-semibold text-ink">
        {title}
      </h2>
      <div className="mt-2 flex flex-col gap-3 text-[15px] leading-relaxed text-ink/75">
        {children}
      </div>
    </section>
  );
}

function Emph({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>;
}

export default function PrivacyPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Privacy &amp; your data
          </h1>
          <p className="mt-1 text-sm text-muted">
            PayTrack reads your payslips and receipts to work out your pay and
            tax. Here is exactly what happens to that data — in plain English.
          </p>
        </div>

        <Card>
          {/* The short version */}
          <div className="rounded-2xl bg-accent-soft/50 p-5">
            <h2 className="text-sm font-semibold text-ink">The short version</h2>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm text-ink/80">
              {[
                "Your uploaded payslip PDF is deleted the moment you confirm or cancel — and within an hour at the very latest. Only the figures you check are kept.",
                "Receipts are never saved at all. They are read in memory and thrown away; only the deduction details you save remain.",
                "Your password is stored only as a one-way hash — we can never see it.",
                "You can export everything, or permanently delete your account and all its data, at any time.",
              ].map((point) => (
                <li key={point} className="flex gap-2.5">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-accent"
                  >
                    <path
                      d="M4 9.5l3 3 7-7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-8">
            <Section id="what-we-store" title="What PayTrack stores">
              <p>To run your account, PayTrack keeps:</p>
              <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-muted">
                <li>
                  <Emph>Your account details</Emph> — your email address, and a
                  hashed version of your password. Optionally a display name, a
                  profile picture, and a phone number if you turn on SMS
                  verification.
                </li>
                <li>
                  <Emph>Payslip figures</Emph> — the pay-period dates and the
                  amounts you confirm (gross, net, tax, superannuation and any
                  allowances). The original PDF is not among them.
                </li>
                <li>
                  <Emph>Deductions</Emph> — the description, category, amount and
                  date you save for each work expense. The original receipt is
                  not kept.
                </li>
              </ul>
            </Section>

            <Section id="payslips" title="Your payslip PDFs are temporary">
              <p>
                When you upload a payslip, the PDF is stored briefly on the
                server — outside the public web folder, so it is never reachable
                by a link — only long enough to read the figures out of it. It is
                then deleted the instant you <Emph>confirm</Emph> or{" "}
                <Emph>cancel</Emph>, and any file that somehow lingers is purged
                automatically <Emph>within one hour</Emph>. What remains is only
                the numbers you reviewed and saved.
              </p>
            </Section>

            <Section id="receipts" title="Your receipts are never stored">
              <p>
                Receipts are handled differently again: the file is read entirely
                in memory to pull out the date, amount and description, then
                discarded. It is <Emph>never written to disk</Emph> or saved
                anywhere. Only the deduction details you choose to save become
                part of your account.
              </p>
            </Section>

            <Section id="ai" title="AI document parsing">
              <p>
                To read payslips and receipts of any layout, PayTrack can send the{" "}
                <Emph>text</Emph> extracted from your document to Google&apos;s
                Gemini API, which identifies the figures and sends the result
                back. The document is never uploaded as a file, and PayTrack does
                not retain the text after parsing. This text is processed under
                Google&apos;s API terms.
              </p>
              <p>
                This step is optional. When AI parsing is switched off, documents
                are read entirely on PayTrack&apos;s own servers using built-in
                pattern matching, and <Emph>none of your document data leaves
                PayTrack</Emph>.
              </p>
            </Section>

            <Section id="security" title="Keeping your account secure">
              <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-muted">
                <li>
                  Passwords are hashed with bcrypt and never stored, logged or
                  displayed in plain text.
                </li>
                <li>
                  Optional two-step verification sends a one-time code to your
                  email (or phone). The code itself is stored only as a one-way
                  hash, expires within minutes, and allows a limited number of
                  attempts.
                </li>
                <li>
                  You stay signed in through a signed, http-only session cookie —
                  not readable by scripts in your browser.
                </li>
                <li>
                  Repeated failed sign-ins are automatically rate-limited to
                  frustrate password guessing.
                </li>
              </ul>
            </Section>

            <Section id="sharing" title="Who else touches your data">
              <p>
                PayTrack does not sell your data or share it for advertising. A
                few service providers process it only so the app can function:
              </p>
              <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-muted">
                <li>
                  <Emph>Google (Gemini API)</Emph> — receives the extracted
                  document text to parse it, and only when AI parsing is enabled.
                </li>
                <li>
                  <Emph>Our email provider</Emph> — delivers your sign-in
                  verification codes.
                </li>
                <li>
                  <Emph>Our hosting and database providers</Emph> (currently
                  Vercel and Neon) — run the app and store your account data on
                  secure cloud infrastructure.
                </li>
                <li>
                  <Emph>An SMS provider</Emph> — only if you enable SMS two-step
                  verification, to text your codes.
                </li>
              </ul>
            </Section>

            <Section id="controls" title="You're in control">
              <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-muted">
                <li>
                  <Emph>Take it with you.</Emph> The{" "}
                  <Link href="/export" className="text-accent hover:underline">
                    Export
                  </Link>{" "}
                  page lets you download your payslips and deductions as CSV files
                  or a printable report at any time.
                </li>
                <li>
                  <Emph>Fix it.</Emph> You can edit your profile, and correct any
                  figure before it is saved.
                </li>
                <li>
                  <Emph>Erase it.</Emph> Deleting your account from the{" "}
                  <Link href="/profile" className="text-accent hover:underline">
                    Profile
                  </Link>{" "}
                  page permanently removes your account and everything linked to
                  it — payslips, deductions and verification codes. This cannot be
                  undone.
                </li>
              </ul>
            </Section>

            <Section id="retention" title="How long data is kept">
              <p>
                Your account data is kept until you delete it or close your
                account. Temporary uploaded PDFs last at most one hour;
                verification codes expire within minutes. Deleting your account
                removes all of it.
              </p>
            </Section>

            <Section id="changes" title="Changes to this policy">
              <p>
                If this policy changes, the date below will be updated. Continued
                use of PayTrack after a change means you accept the revised
                policy.
              </p>
            </Section>

            <Section id="contact" title="Questions">
              <p>
                If you have any question about your data, contact us at{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-accent hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </Section>
          </div>

          <p className="mt-8 border-t border-ink/10 pt-5 text-xs text-muted">
            Last updated {LAST_UPDATED}.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
