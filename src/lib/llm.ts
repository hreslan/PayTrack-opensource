// LLM client. Calls a Gemini flash model through Google's OpenAI-compatible
// chat/completions endpoint with plain fetch (no SDK). Used to parse
// payslips/receipts of arbitrary layouts; the app falls back to the built-in
// pattern parser when no key is configured or the call fails.

// Google's OpenAI-compatibility endpoint. Auth is a plain Bearer key, same as
// any OpenAI-compatible host.
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
// A "-latest" alias, deliberately: Google gated the pinned gemini-2.5-flash for
// new keys, so we track the current flash-lite instead of a version that can be
// retired out from under us. Plenty capable for this structured-extraction task.
const MODEL = "gemini-flash-lite-latest";
const DEFAULT_TIMEOUT_MS = 30_000;
// Payslips/receipts are short; cap input so a huge PDF can't run up tokens.
const MAX_INPUT_CHARS = 12_000;

export function llmConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
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
export async function callLlmJson(
  system: string,
  user: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const base = {
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user.slice(0, MAX_INPUT_CHARS) },
    ],
    temperature: 0,
    max_tokens: 4096,
    stream: false,
    // Flash "thinks" by default, which is slow and can exhaust the output
    // budget on a task this simple. Turn it off for fast, deterministic JSON.
    reasoning_effort: "none",
  };

  const post = (body: object) =>
    fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

  try {
    // Prefer strict JSON mode; retry plain if the host 400s on it.
    let res = await post({ ...base, response_format: { type: "json_object" } });
    if (res.status === 400) res = await post(base);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Gemini API ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("Gemini returned no content");
    }
    return extractJson(content);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Gemini request timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
