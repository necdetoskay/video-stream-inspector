import { mkdir, open, unlink } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { isAcquisitionPermit, type AcquisitionPermit } from "@vsi/policy";

export type DirectDownloadInput = {
  url: string;
  outputDirectory: string;
  filename: string;
  permit: AcquisitionPermit;
  maxBytes?: number;
};

export type DirectDownloadResult = {
  path: string;
  bytes: number;
  mimeType: string;
};

const DEFAULT_MAX_BYTES = 100 * 1024 * 1024;

export function sanitizeFilename(value: string): string {
  const leaf = basename(value.trim());
  const sanitized = leaf.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").replace(/\s+/g, " ");
  if (!sanitized || sanitized === "." || sanitized === "..") {
    throw new Error("A valid output filename is required");
  }
  return sanitized;
}

export async function downloadDirectFile(input: DirectDownloadInput): Promise<DirectDownloadResult> {
  if (!isAcquisitionPermit(input.permit)) {
    throw new Error("A valid acquisition permit is required");
  }

  const url = new URL(input.url);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http and https downloads are supported");
  }
  if (url.username || url.password) {
    throw new Error("Credential-bearing URLs are not supported");
  }

  const maxBytes = input.maxBytes ?? DEFAULT_MAX_BYTES;
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new Error("maxBytes must be a positive safe integer");
  }

  const filename = sanitizeFilename(input.filename);
  const outputDirectory = resolve(input.outputDirectory);
  await mkdir(outputDirectory, { recursive: true });
  const outputPath = join(outputDirectory, filename);

  const response = await fetch(url, {
    redirect: "error",
    credentials: "omit",
  });

  if (!response.ok) {
    throw new Error(`Download failed with HTTP ${response.status}`);
  }

  const mimeType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  if (!mimeType.startsWith("video/") && !mimeType.startsWith("audio/")) {
    throw new Error(`Unsupported direct media content type: ${mimeType || "missing"}`);
  }

  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new Error(`Download exceeds maxBytes (${maxBytes})`);
  }

  if (!response.body) {
    throw new Error("Download response has no body");
  }

  const file = await open(outputPath, "wx");
  let bytes = 0;
  let completed = false;

  try {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new Error(`Download exceeds maxBytes (${maxBytes})`);
      }
      await file.write(value);
    }
    completed = true;
    return { path: outputPath, bytes, mimeType };
  } finally {
    await file.close();
    if (!completed) {
      await unlink(outputPath).catch(() => undefined);
    }
  }
}
