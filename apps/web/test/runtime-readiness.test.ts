import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkRuntimeReadiness } from "../lib/runtime-readiness";

const created: string[] = [];
const original = process.env.VSI_DOWNLOAD_DIR;

afterEach(async () => {
  if (original === undefined) delete process.env.VSI_DOWNLOAD_DIR;
  else process.env.VSI_DOWNLOAD_DIR = original;
  await Promise.all(created.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("checkRuntimeReadiness", () => {
  it("READY-001 creates and verifies a writable download directory", async () => {
    const base = await mkdtemp(join(tmpdir(), "vsi-ready-"));
    created.push(base);
    process.env.VSI_DOWNLOAD_DIR = join(base, "downloads");

    const result = await checkRuntimeReadiness();
    expect(result.ready).toBe(true);
    if (result.ready) expect(result.downloadDirectory.endsWith("downloads")).toBe(true);
  });

  it("READY-002 fails closed when the configured path is a file", async () => {
    const base = await mkdtemp(join(tmpdir(), "vsi-ready-"));
    created.push(base);
    const filePath = join(base, "not-a-directory");
    await import("node:fs/promises").then(({ writeFile }) => writeFile(filePath, "x"));
    process.env.VSI_DOWNLOAD_DIR = filePath;

    await expect(checkRuntimeReadiness()).resolves.toEqual({
      ready: false,
      reason: "download-directory-unavailable",
    });
  });
});
