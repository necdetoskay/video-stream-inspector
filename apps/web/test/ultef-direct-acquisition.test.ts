import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { acquireDirect } from "../lib/acquire-direct";
import { acquisitionIntentStore, inspectionRegistry } from "../lib/acquisition-state";

const tempDirs: string[] = [];

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function registerDirectCandidate(url = "https://1.1.1.1/ultef-sample.mp4") {
  const record = inspectionRegistry.register({
    pageUrl: "https://example.com/watch",
    finalUrl: "https://example.com/watch",
    candidates: [{ url, kind: "direct" }],
  });
  const candidate = inspectionRegistry.assertDirectCandidate(record.id, url);
  const intent = acquisitionIntentStore.issue({ url: candidate.url, kind: "direct" });
  return { record, candidate, intent };
}

function mockMediaFetch(body = "ULTEF-FIXTURE-VIDEO") {
  const fetchMock = vi.fn(async () => new Response(body, {
    status: 200,
    headers: {
      "content-type": "video/mp4",
      "content-length": String(Buffer.byteLength(body)),
    },
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("ULTEF direct acquisition journey", () => {
  it("ULTEF-ACQUIRE-001 observed direct candidate -> intent -> policy permit -> file", async () => {
    const { candidate, intent } = registerDirectCandidate();
    const outputDirectory = await mkdtemp(join(tmpdir(), "vsi-ultef-"));
    tempDirs.push(outputDirectory);
    const fetchMock = mockMediaFetch();

    const outcome = await acquireDirect({
      intentToken: intent.token,
      candidateUrl: candidate.url,
      authorization: { authorized: true, basis: "owned" },
      protectionSignals: [],
      outputDirectory,
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error("expected allowed acquisition");
    expect(outcome.decision.code).toBe("allow-explicit-authorization");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(outcome.download.mimeType).toBe("video/mp4");
    expect(await readFile(outcome.download.path, "utf8")).toBe("ULTEF-FIXTURE-VIDEO");
  });

  it("ULTEF-ACQUIRE-002 replay of a consumed intent is rejected before a second fetch", async () => {
    const { candidate, intent } = registerDirectCandidate("https://1.1.1.1/replay.mp4");
    const outputDirectory = await mkdtemp(join(tmpdir(), "vsi-ultef-"));
    tempDirs.push(outputDirectory);
    const fetchMock = mockMediaFetch("REPLAY-FIXTURE");

    const input = {
      intentToken: intent.token,
      candidateUrl: candidate.url,
      authorization: { authorized: true, basis: "owned" as const },
      protectionSignals: [],
      outputDirectory,
    };

    const first = await acquireDirect(input);
    expect(first.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await expect(acquireDirect(input)).rejects.toThrow("Invalid or already-used acquisition intent");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("ULTEF-ACQUIRE-003 unauthorized request is denied before intent consumption and network", async () => {
    const { candidate, intent } = registerDirectCandidate("https://1.1.1.1/authorization.mp4");
    const outputDirectory = await mkdtemp(join(tmpdir(), "vsi-ultef-"));
    tempDirs.push(outputDirectory);
    const fetchMock = mockMediaFetch("AUTHORIZED-RETRY");

    const denied = await acquireDirect({
      intentToken: intent.token,
      candidateUrl: candidate.url,
      authorization: { authorized: false },
      protectionSignals: [],
      outputDirectory,
    });

    expect(denied.ok).toBe(false);
    expect(denied.decision.code).toBe("deny-no-authorization");
    expect(fetchMock).not.toHaveBeenCalled();

    const retry = await acquireDirect({
      intentToken: intent.token,
      candidateUrl: candidate.url,
      authorization: { authorized: true, basis: "permission" },
      protectionSignals: [],
      outputDirectory,
    });
    expect(retry.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("ULTEF-ACQUIRE-004 protection signal denies before intent consumption and network", async () => {
    const { candidate, intent } = registerDirectCandidate("https://1.1.1.1/protected.mp4");
    const outputDirectory = await mkdtemp(join(tmpdir(), "vsi-ultef-"));
    tempDirs.push(outputDirectory);
    const fetchMock = mockMediaFetch();

    const denied = await acquireDirect({
      intentToken: intent.token,
      candidateUrl: candidate.url,
      authorization: { authorized: true, basis: "owned" },
      protectionSignals: [{ kind: "drm", evidence: "test fixture protection signal" }],
      outputDirectory,
    });

    expect(denied.ok).toBe(false);
    expect(denied.decision.code).toBe("deny-protection-signal");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ULTEF-ACQUIRE-005 URL swap is rejected before network", async () => {
    const { intent } = registerDirectCandidate("https://1.1.1.1/original.mp4");
    const outputDirectory = await mkdtemp(join(tmpdir(), "vsi-ultef-"));
    tempDirs.push(outputDirectory);
    const fetchMock = mockMediaFetch();

    await expect(acquireDirect({
      intentToken: intent.token,
      candidateUrl: "https://1.1.1.1/swapped.mp4",
      authorization: { authorized: true, basis: "owned" },
      protectionSignals: [],
      outputDirectory,
    })).rejects.toThrow("Acquisition intent does not match candidate");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
