"use client";

import { FormEvent, useState } from "react";

type Candidate = {
  url: string;
  kind: "direct" | "hls" | "dash" | "unknown";
  mimeType?: string;
  sources: string[];
  confidence: number;
  reasons: string[];
};

type InspectionReport = {
  pageUrl: string;
  finalUrl: string;
  candidates: Candidate[];
};

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<InspectionReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch("/api/inspect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Inspection failed");
      setReport(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Inspection failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">LOCAL-FIRST MEDIA INSPECTION</p>
        <h1>Video Stream Inspector</h1>
        <p className="lede">Inspect a page for direct media, HLS, and DASH endpoints. Discovery is read-only and does not imply download permission.</p>
      </section>

      <form className="inspect-form" onSubmit={submit}>
        <label htmlFor="url">Page URL</label>
        <div className="row">
          <input id="url" type="url" required placeholder="https://example.com/media-page" value={url} onChange={(event) => setUrl(event.target.value)} />
          <button type="submit" disabled={loading}>{loading ? "Inspecting…" : "Inspect"}</button>
        </div>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {report ? (
        <section className="report">
          <div className="summary">
            <div><span>Requested</span><strong>{report.pageUrl}</strong></div>
            <div><span>Final URL</span><strong>{report.finalUrl}</strong></div>
            <div><span>Candidates</span><strong>{report.candidates.length}</strong></div>
          </div>
          <div className="cards">
            {report.candidates.map((candidate) => (
              <article className="candidate" key={candidate.url}>
                <header><span className={`kind ${candidate.kind}`}>{candidate.kind.toUpperCase()}</span><span>{Math.round(candidate.confidence * 100)}%</span></header>
                <code>{candidate.url}</code>
                {candidate.mimeType ? <p>MIME: {candidate.mimeType}</p> : null}
                <p>Observed via: {candidate.sources.join(", ")}</p>
                <ul>{candidate.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
              </article>
            ))}
            {report.candidates.length === 0 ? <p className="empty">No supported media candidates were observed.</p> : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
