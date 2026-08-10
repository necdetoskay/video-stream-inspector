import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { issueAcquisitionPermit, type AcquisitionPermit } from "@vsi/policy";
import { downloadDirectFile, sanitizeFilename } from "../src/index";

const tempDirs: string[] = [];
afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function startFixture(contentType = "video/mp4", body = Buffer.from("fixture-video")) {
  const server = createServer((_req, res) => {
    res.writeHead(200, { "content-type": contentType, "content-length": body.length });
    res.end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("fixture server failed");
  return {
    url: `http://127.0.0.1:${address.port}/sample.mp4`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}

function permit(): AcquisitionPermit {
  const result = issueAcquisitionPermit({
    authorization: { authorized: true, basis: "owned" },
    protectionSignals: [],
  });
  if (!result.permit) throw new Error("expected permit");
  return result.permit;
}

describe("downloadDirectFile", () => {
  it("DIRECT-DOWNLOAD-001 saves permitted direct media", async () => {
    const fixture = await startFixture();
    const dir = await mkdtemp(join(tmpdir(), "vsi-"));
    tempDirs.push(dir);
    try {
      const result = await downloadDirectFile({
        url: fixture.url,
        outputDirectory: dir,
        filename: "sample.mp4",
        permit: permit(),
      });
      expect(result.bytes).toBe(13);
      expect(result.mimeType).toBe("video/mp4");
      expect(await readFile(result.path, "utf8")).toBe("fixture-video");
    } finally {
      await fixture.close();
    }
  });

  it("DIRECT-DOWNLOAD-002 rejects forged permits", async () => {
    const dir = await mkdtemp(join(tmpdir(), "vsi-"));
    tempDirs.push(dir);
    await expect(downloadDirectFile({
      url: "http://127.0.0.1/example.mp4",
      outputDirectory: dir,
      filename: "x.mp4",
      permit: { decisionCode: "allow-explicit-authorization" } as unknown as AcquisitionPermit,
    })).rejects.toThrow("valid acquisition permit");
  });

  it("DIRECT-DOWNLOAD-003 rejects non-media responses", async () => {
    const fixture = await startFixture("text/html", Buffer.from("hello"));
    const dir = await mkdtemp(join(tmpdir(), "vsi-"));
    tempDirs.push(dir);
    try {
      await expect(downloadDirectFile({
        url: fixture.url,
        outputDirectory: dir,
        filename: "x.mp4",
        permit: permit(),
      })).rejects.toThrow("Unsupported direct media content type");
    } finally {
      await fixture.close();
    }
  });

  it("DIRECT-DOWNLOAD-004 enforces maxBytes", async () => {
    const fixture = await startFixture("video/mp4", Buffer.from("0123456789"));
    const dir = await mkdtemp(join(tmpdir(), "vsi-"));
    tempDirs.push(dir);
    try {
      await expect(downloadDirectFile({
        url: fixture.url,
        outputDirectory: dir,
        filename: "x.mp4",
        permit: permit(),
        maxBytes: 4,
      })).rejects.toThrow("exceeds maxBytes");
    } finally {
      await fixture.close();
    }
  });

  it("DIRECT-DOWNLOAD-005 strips path traversal from filenames", () => {
    expect(sanitizeFilename("../../movie.mp4")).toBe("movie.mp4");
  });
});
