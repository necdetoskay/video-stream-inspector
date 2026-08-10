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
  inspectionId: string;
  inspectionExpiresAt: number;
};

type AcquisitionStatus = {
  state: "idle" | "working" | "success" | "error";
  message?: string;
};

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<InspectionReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [authorizationBasis, setAuthorizationBasis] = useState<"owned" | "permission" | "public-domain">("owned");
  const [acquisition, setAcquisition] = useState<Record<string, AcquisitionStatus>>({});

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setReport(null);
    setAuthorized(false);
    setAcquisition({});
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

  async function acquire(candidate: Candidate) {
    if (!report || candidate.kind !== "direct" || !authorized) return;
    setAcquisition((current) => ({ ...current, [candidate.url]: { state: "working", message: "Preparing permitted acquisition…" } }));

    try {
      const intentResponse = await fetch("/api/acquisition-intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ inspectionId: report.inspectionId, candidateUrl: candidate.url }),
      });
      const intent = await intentResponse.json();
      if (!intentResponse.ok) throw new Error(intent.error ?? "Acquisition intent denied");

      const acquireResponse = await fetch("/api/acquire-direct", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          intentToken: intent.token,
          candidateUrl: candidate.url,
          authorized: true,
          authorizationBasis,
          protectionSignals: [],
        }),
      });
      const result = await acquireResponse.json();
      if (!acquireResponse.ok) throw new Error(result.error ?? "Acquisition failed");

      setAcquisition((current) => ({
        ...current,
        [candidate.url]: {
          state: "success",
          message: `Saved ${result.download.filename} (${result.download.bytes} bytes, ${result.download.mimeType})`,
        },
      }));
    } catch (cause) {
      setAcquisition((current) => ({
        ...current,
        [candidate.url]: { state: "error", message: cause instanceof Error ? cause.message : "Acquisition failed" },
      }));
    }
  }

  const hasDirectCandidates = report?.candidates.some((candidate) => candidate.kind === "direct") ?? false;

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

          {hasDirectCandidates ? (
            <section className="authorization-panel" aria-labelledby="authorization-heading">
              <h2 id="authorization-heading">Direct media acquisition</h2>
              <p>Saving is available only for direct media you own, have permission to copy, or that is public domain. HLS and DASH remain inspection-only.</p>
              <label className="authorization-check">
                <input type="checkbox" checked={authorized} onChange={(event) => setAuthorized(event.target.checked)} />
                <span>I confirm I am authorized to save this media.</span>
              </label>
              <label className="basis-label" htmlFor="authorization-basis">Authorization basis</label>
              <select id="authorization-basis" value={authorizationBasis} onChange={(event) => setAuthorizationBasis(event.target.value as typeof authorizationBasis)}>
                <option value="owned">I own the media</option>
                <option value="permission">I have permission</option>
                <option value="public-domain">Public domain</option>
              </select>
            </section>
          ) : null}

          <div className="cards">
            {report.candidates.map((candidate) => {
              const status = acquisition[candidate.url] ?? { state: "idle" as const };
              return (
                <article className="candidate" key={candidate.url}>
                  <header><span className={`kind ${candidate.kind}`}>{candidate.kind.toUpperCase()}</span><span>{Math.round(candidate.confidence * 100)}%</span></header>
                  <code>{candidate.url}</code>
                  {candidate.mimeType ? <p>MIME: {candidate.mimeType}</p> : null}
                  <p>Observed via: {candidate.sources.join(", ")}</p>
                  <ul>{candidate.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                  {candidate.kind === "direct" ? (
                    <div className="acquisition-actions">
                      <button type="button" disabled={!authorized || status.state === "working" || status.state === "success"} onClick={() => acquire(candidate)}>
                        {status.state === "working" ? "Saving…" : status.state === "success" ? "Saved" : "Save permitted media"}
                      </button>
                      {status.message ? <p className={`acquisition-status ${status.state}`}>{status.message}</p> : null}
                    </div>
                  ) : <p className="inspection-only">Inspection only — acquisition is not enabled for this stream type.</p>}
                </article>
              );
            })}
            {report.candidates.length === 0 ? <p className="empty">No supported media candidates were observed.</p> : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
