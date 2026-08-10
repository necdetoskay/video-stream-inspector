import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inspectPage } from "../src/inspect.js";

let server: Server;
let origin: string;

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === "/") {
      res.setHeader("content-type", "text/html");
      res.end(`<!doctype html><html><body>
        <video src="/static/movie.mp4"></video>
        <script>
          setTimeout(() => {
            fetch('/stream/master.m3u8');
            fetch('/dash/manifest.mpd');
            fetch('/api/data.json');
          }, 20);
        </script>
      </body></html>`);
      return;
    }
    if (req.url === "/static/movie.mp4") {
      res.setHeader("content-type", "video/mp4");
      res.end(Buffer.from([0, 0, 0, 0]));
      return;
    }
    if (req.url === "/stream/master.m3u8") {
      res.setHeader("content-type", "application/vnd.apple.mpegurl");
      res.end("#EXTM3U\n#EXT-X-VERSION:3\n");
      return;
    }
    if (req.url === "/dash/manifest.mpd") {
      res.setHeader("content-type", "application/dash+xml");
      res.end("<MPD></MPD>");
      return;
    }
    if (req.url === "/api/data.json") {
      res.setHeader("content-type", "application/json");
      res.end('{"ok":true}');
      return;
    }
    res.statusCode = 404;
    res.end("not found");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("fixture server failed to bind");
  origin = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

describe("inspectPage", () => {
  it("captures and deduplicates media from real Chromium network and DOM evidence", async () => {
    const report = await inspectPage(origin);
    expect(report.media.map((item) => [item.url, item.kind])).toEqual([
      [`${origin}/dash/manifest.mpd`, "dash"],
      [`${origin}/static/movie.mp4`, "direct"],
      [`${origin}/stream/master.m3u8`, "hls"],
    ]);
    const direct = report.media.find((item) => item.kind === "direct");
    expect(direct?.sources.sort()).toEqual(["dom", "network"]);
    expect(report.media.some((item) => item.url.endsWith("data.json"))).toBe(false);
  });
});
