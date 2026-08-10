import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { issueAcquisitionPermit, type AcquisitionPermit } from "@vsi/policy";
import { downloadDirectFile, sanitizeFilename } from "../src/index";

const tempDirs: string[] = [];
afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function permit(): AcquisitionPermit {
  const result = issueAcquisitionPermit({
    authorization: { authorized: true, basis: "owned" },
    protectionSignals: [],
  });
  if (!result.permit) throw new Error("expected permit");
  return result.permit;
}

function mockMediaFetch(contentType = "video/mp4", body = "fixture-video") {
  const fetchMock = vi.fn(async () => new Response(body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "content-length": String(Buffer.byteLength(body)),
    },
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("downloadDirectFile", () => {
  it("DIRECT-DOWNLOAD-001 saves permitted direct media from a public target", async () => {
    const fetchMock = mockMediaFetch();
    const dir = await mkdtemp(join(tmpdir(), "vsi-"));
    tempDirs.push(dir);

    const result = await downloadDirectFile({
      url: "https://1.1.1.1/sample.mp4",
      outputDirectory: dir,
      filename: "sample.mp4",
      permit: permit(),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.bytes).toBe(13);
    expect(result.mimeType).toBe("video/mp4");
    expect(await readFile(result.path, "utf8")).toBe("fixture-video");
  });

  it("DIRECT-DOWNLOAD-002 rejects forged permits", async () => {
    const dir = await mkdtemp(join(tmpdir(), "vsi-"));
    tempDirs.push(dir);
    await expect(downloadDirectFile({
      url: "https://1.1.1.1/example.mp4",
      outputDirectory: dir,
      filename: "x.mp4",
      permit: { decisionCode: "allow-explicit-authorization" } as unknown as AcquisitionPermit,
    })).rejects.toThrow("valid acquisition permit");
  });

  it("DIRECT-DOWNLOAD-003 rejects non-media responses", async () => {
    mockMediaFetch("text/html", "hello");
    const dir = await mkdtemp(join(tmpdir(), "vsi-"));
    tempDirs.push(dir);

    await expect(downloadDirectFile({
      url: "https://1.1.1.1/page",
      outputDirectory: dir,
      filename: "x.mp4",
      permit: permit(),
    })).rejects.toThrow("Unsupported direct media content type");
  });

  it("DIRECT-DOWNLOAD-004 enforces maxBytes", async () => {
    mockMediaFetch("video/mp4", "0123456789");
    const dir = await mkdtemp(join(tmpdir(), "vsi-"));
    tempDirs.push(dir);

    await expect(downloadDirectFile({
      url: "https://1.1.1.1/sample.mp4",
      outputDirectory: dir,
      filename: "x.mp4",
      permit: permit(),
      maxBytes: 4,
    })).rejects.toThrow("exceeds maxBytes");
  });

  it("DIRECT-DOWNLOAD-005 strips path traversal from filenames", () => {
    expect(sanitizeFilename("../../movie.mp4")).toBe("movie.mp4");
  });

  it("DIRECT-DOWNLOAD-006 rejects private network targets before fetch", async () => {
    const fetchMock = mockMediaFetch();
    const dir = await mkdtemp(join(tmpdir(), "vsi-"));
    tempDirs.push(dir);

    await expect(downloadDirectFile({
      url: "http://127.0.0.1/private.mp4",
      outputDirectory: dir,
      filename: "private.mp4",
      permit: permit(),
    })).rejects.toThrow("Private or reserved network target is not allowed");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
