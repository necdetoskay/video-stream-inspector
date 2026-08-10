import { randomBytes } from "node:crypto";

export type AcquisitionIntent = {
  token: string;
  url: string;
  kind: "direct";
  expiresAt: number;
};

type StoredIntent = AcquisitionIntent & { used: boolean };

export class AcquisitionIntentStore {
  readonly #entries = new Map<string, StoredIntent>();

  constructor(private readonly ttlMs = 60_000) {
    if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) {
      throw new Error("ttlMs must be a positive safe integer");
    }
  }

  issue(input: { url: string; kind: "direct" }, now = Date.now()): AcquisitionIntent {
    const url = new URL(input.url);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Only HTTP(S) direct candidates can receive acquisition intents");
    }

    const token = randomBytes(32).toString("base64url");
    const intent: StoredIntent = {
      token,
      url: url.href,
      kind: "direct",
      expiresAt: now + this.ttlMs,
      used: false,
    };
    this.#entries.set(token, intent);
    return { token: intent.token, url: intent.url, kind: intent.kind, expiresAt: intent.expiresAt };
  }

  consume(input: { token: string; url: string; kind: "direct" }, now = Date.now()): AcquisitionIntent {
    const stored = this.#entries.get(input.token);
    if (!stored || stored.used) throw new Error("Invalid or already-used acquisition intent");
    if (stored.expiresAt <= now) {
      this.#entries.delete(input.token);
      throw new Error("Acquisition intent expired");
    }

    const requestedUrl = new URL(input.url).href;
    if (stored.url !== requestedUrl || stored.kind !== input.kind) {
      throw new Error("Acquisition intent does not match candidate");
    }

    stored.used = true;
    this.#entries.delete(input.token);
    return { token: stored.token, url: stored.url, kind: stored.kind, expiresAt: stored.expiresAt };
  }
}
