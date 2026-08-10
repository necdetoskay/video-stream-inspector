import { basename } from "node:path";
import { downloadDirectFile, type DirectDownloadResult } from "@vsi/downloader";
import { issueAcquisitionPermit, type AcquisitionPolicyInput } from "@vsi/policy";
import { acquisitionIntentStore } from "./acquisition-state";

export type AcquireDirectInput = {
  intentToken: string;
  candidateUrl: string;
  authorization: AcquisitionPolicyInput["authorization"];
  protectionSignals: AcquisitionPolicyInput["protectionSignals"];
  outputDirectory: string;
};

export type AcquireDirectOutcome =
  | { ok: false; decision: ReturnType<typeof issueAcquisitionPermit>["decision"] }
  | { ok: true; decision: ReturnType<typeof issueAcquisitionPermit>["decision"]; download: DirectDownloadResult };

export async function acquireDirect(input: AcquireDirectInput): Promise<AcquireDirectOutcome> {
  const { decision, permit } = issueAcquisitionPermit({
    authorization: input.authorization,
    protectionSignals: input.protectionSignals,
  });

  if (!permit) return { ok: false, decision };

  const intent = acquisitionIntentStore.consume({
    token: input.intentToken,
    url: input.candidateUrl,
    kind: "direct",
  });

  const parsed = new URL(intent.url);
  const filename = basename(decodeURIComponent(parsed.pathname)) || "media.bin";
  const download = await downloadDirectFile({
    url: intent.url,
    outputDirectory: input.outputDirectory,
    filename,
    permit,
  });

  return { ok: true, decision, download };
}
