// Delivers verification codes. Email goes via SMTP when EMAIL_SERVER_* is set;
// SMS goes via Twilio's REST API when TWILIO_* is set and the user has a phone.
// With neither configured the code is printed to the server console so the
// flow still works in development.

type Recipient = { email: string; phone: string | null };

function emailConfigured() {
  return Boolean(
    process.env.EMAIL_SERVER_HOST &&
      process.env.EMAIL_SERVER_USER &&
      process.env.EMAIL_SERVER_PASSWORD
  );
}

function smsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM
  );
}

async function sendEmail(to: string, code: string) {
  const { createTransport } = await import("nodemailer");
  const transport = createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 465),
    secure: Number(process.env.EMAIL_SERVER_PORT ?? 465) === 465,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
  await transport.sendMail({
    from: process.env.EMAIL_FROM ?? process.env.EMAIL_SERVER_USER,
    to,
    subject: `${code} is your verification code`,
    text: `Your Payslip Dashboard verification code is ${code}. It expires in 10 minutes.\n\nIf you didn't try to log in, you can ignore this email.`,
  });
}

async function sendSms(to: string, code: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const body = new URLSearchParams({
    To: to,
    From: process.env.TWILIO_FROM!,
    Body: `Your Payslip Dashboard verification code is ${code}. It expires in 10 minutes.`,
  });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );
  if (!res.ok) {
    throw new Error(`Twilio responded ${res.status}: ${await res.text()}`);
  }
}

/** Returns the comma-separated channels the code actually went out on. */
export async function sendCode(user: Recipient, code: string): Promise<string> {
  const sent: string[] = [];

  if (emailConfigured()) {
    try {
      await sendEmail(user.email, code);
      sent.push("email");
    } catch (err) {
      console.error("Failed to send verification email:", err);
    }
  }

  if (smsConfigured() && user.phone) {
    try {
      await sendSms(user.phone, code);
      sent.push("sms");
    } catch (err) {
      console.error("Failed to send verification SMS:", err);
    }
  }

  if (sent.length === 0) {
    console.log(
      `\n========================================\n` +
        `  Verification code for ${user.email}: ${code}\n` +
        `  (configure EMAIL_SERVER_* in .env to send real emails)\n` +
        `========================================\n`
    );
    return "console";
  }

  return sent.join(",");
}
