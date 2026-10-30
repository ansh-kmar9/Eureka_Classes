import "server-only";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-3.1-flash-lite";
/** Tried if the main model is unavailable. Model names change over time, so both are configurable. */
const FALLBACK_MODEL = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 25_000;

export type GeminiErrorKind = "not_configured" | "busy" | "failed";

export class GeminiError extends Error {
  constructor(
    public kind: GeminiErrorKind,
    message: string,
  ) {
    super(message);
  }
}

/** A JSON-schema-like description of the reply (Gemini's OpenAPI subset, with upper-case types). */
export type GeminiSchema = Record<string, unknown>;

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

interface CallOptions {
  system: string;
  turns: ChatTurn[];
  maxOutputTokens: number;
  temperature: number;
  schema?: GeminiSchema;
}

async function callModel(model: string, apiKey: string, options: CallOptions): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${ENDPOINT}/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: options.system }] },
        contents: options.turns.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
        generationConfig: {
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens,
          ...(options.schema
            ? { responseMimeType: "application/json", responseSchema: options.schema }
            : {}),
        },
      }),
    });

    // 429 is the free-tier limit being hit; 5xx is Google having a bad moment.
    if (response.status === 429 || response.status >= 500) {
      throw new GeminiError("busy", `Gemini ${response.status}`);
    }
    if (!response.ok) throw new GeminiError("failed", `Gemini ${response.status}`);

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    };
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    if (!text) throw new GeminiError("failed", "Empty reply");
    // A JSON reply cut off by the token limit cannot be parsed; a chat reply can still be shown.
    if (options.schema && candidate?.finishReason === "MAX_TOKENS") {
      throw new GeminiError("failed", "Truncated reply");
    }
    return text;
  } catch (error) {
    if (error instanceof GeminiError) throw error;
    // Timeouts and network errors.
    throw new GeminiError("busy", error instanceof Error ? error.message : "Network error");
  } finally {
    clearTimeout(timer);
  }
}

/** Runs the call on the main model, then the fallback. The key stays on the server. */
async function run<T>(options: CallOptions, parse: (text: string) => T): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError("not_configured", "GEMINI_API_KEY is not set");

  const primary = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const models = primary === FALLBACK_MODEL ? [primary] : [primary, FALLBACK_MODEL];

  let lastError: unknown;
  for (const model of models) {
    try {
      return parse(await callModel(model, apiKey, options));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof GeminiError ? lastError : new GeminiError("failed", "Unreadable reply");
}

/** Asks for a JSON reply that matches `schema`, and returns it parsed. */
export function generateJson<T>(request: {
  system: string;
  prompt: string;
  schema: GeminiSchema;
  maxOutputTokens?: number;
  temperature?: number;
}): Promise<T> {
  return run(
    {
      system: request.system,
      turns: [{ role: "user", text: request.prompt }],
      maxOutputTokens: request.maxOutputTokens ?? 1200,
      temperature: request.temperature ?? 0.4,
      schema: request.schema,
    },
    (text) => JSON.parse(text) as T,
  );
}

/** Continues a conversation and returns the model's next message as plain text. */
export function generateChat(request: {
  system: string;
  turns: ChatTurn[];
  maxOutputTokens?: number;
  temperature?: number;
}): Promise<string> {
  return run(
    {
      system: request.system,
      turns: request.turns,
      maxOutputTokens: request.maxOutputTokens ?? 900,
      temperature: request.temperature ?? 0.6,
    },
    (text) => text.trim(),
  );
}
