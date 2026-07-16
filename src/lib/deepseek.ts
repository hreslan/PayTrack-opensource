// DeepSeek client. OpenAI-compatible chat completions API, called with plain
// fetch (no SDK). Used to parse payslips/receipts of arbitrary layouts; the
// app falls back to the built-in pattern parser when no key is configured.

// Override for an OpenAI-compatible proxy or for testing.
const DEEPSEEK_URL =
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/chat/completions";
const DEFAULT_TIMEOUT_MS = 30_000;
// Payslips/receipts are short; cap input so a huge PDF can't run up tokens.
const MAX_INPUT_CHARS = 12_000;

export function deepseekConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

/** Pulls a JSON object out of a model reply that may include reasoning,
 * ```json fences, or a <think> block before the answer. */
export function extractJson(content: string): unknown {
  let s = content.trim();
  const think = s.lastIndexOf("</think>");
  if (think !== -1) s = s.slice(think + "</think>".length);
  s = s.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last > first) s = s.slice(first, last + 1);
  return JSON.parse(s);
}

/** Calls the chat completions API and returns the parsed JSON object. Throws
 * on any transport / status / parse error so callers can fall back to regex. */
export async function callDeepSeekJson(
  system: string,
  user: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<unknown> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY is not set");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const base = {
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user.slice(0, MAX_INPUT_CHARS) },
    ],
    temperature: 0,
    max_tokens: 4096,
    stream: false,
  };

  const post = (body: object) =>
    fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

  try {
    // Prefer strict JSON mode; some hosted models 400 on it, so retry plain.
    let res = await post({ ...base, response_format: { type: "json_object" } });
    if (res.status === 400) res = await post(base);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`DeepSeek API ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("DeepSeek returned no content");
    }
    return extractJson(content);
  } finally {
    clearTimeout(timer);
  }
}
