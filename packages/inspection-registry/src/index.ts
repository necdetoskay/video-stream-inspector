import { randomBytes } from "node:crypto";

export type RegisteredCandidate = {
  url: string;
  kind: "direct" | "hls" | "dash";
};

export type InspectionRecord = {
  id: string;
  pageUrl: string;
  finalUrl: string;
  candidates: RegisteredCandidate[];
  createdAt: number;
  expiresAt: number;
};

export type InspectionRegistryOptions = {
  ttlMs?: number;
  now?: () => number;
};

const DEFAULT_TTL_MS = 10 * 60 * 1000;

export function createInspectionRegistry(options: InspectionRegistryOptions = {}) {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const now = options.now ?? Date.now;
  const records = new Map<string, InspectionRecord>();

  function pruneExpired() {
    const current = now();
    for (const [id, record] of records) {
      if (record.expiresAt <= current) records.delete(id);
    }
  }

  function register(input: Omit<InspectionRecord, "id" | "createdAt" | "expiresAt">): InspectionRecord {
    pruneExpired();
    const createdAt = now();
    const id = randomBytes(24).toString("base64url");
    const record: InspectionRecord = {
      ...input,
      id,
      createdAt,
      expiresAt: createdAt + ttlMs,
      candidates: input.candidates.map((candidate) => ({ ...candidate })),
    };
    records.set(id, record);
    return { ...record, candidates: record.candidates.map((candidate) => ({ ...candidate })) };
  }

  function get(id: string): InspectionRecord | undefined {
    pruneExpired();
    const record = records.get(id);
    if (!record) return undefined;
    return { ...record, candidates: record.candidates.map((candidate) => ({ ...candidate })) };
  }

  function assertDirectCandidate(id: string, candidateUrl: string): RegisteredCandidate {
    const record = get(id);
    if (!record) throw new Error("Inspection record is missing or expired");
    const candidate = record.candidates.find((item) => item.url === candidateUrl);
    if (!candidate) throw new Error("Candidate was not observed in this inspection");
    if (candidate.kind !== "direct") throw new Error("Only direct media candidates can be acquired");
    return candidate;
  }

  return { register, get, assertDirectCandidate };
}
