export type ValidationResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export function validateInspectionUrl(value: unknown): ValidationResult {
  if (typeof value !== "string" || value.trim() === "") {
    return { ok: false, error: "URL is required" };
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, error: "Invalid URL" };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false, error: "Only http and https URLs are supported" };
  }

  return { ok: true, url: parsed.toString() };
}
