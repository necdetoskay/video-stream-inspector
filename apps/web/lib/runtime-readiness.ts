import { access, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

export type ReadinessResult =
  | { ready: true; downloadDirectory: string }
  | { ready: false; reason: string };

export async function checkRuntimeReadiness(): Promise<ReadinessResult> {
  const downloadDirectory = resolve(process.env.VSI_DOWNLOAD_DIR ?? ".vsi-downloads");
  try {
    await mkdir(downloadDirectory, { recursive: true });
    await access(downloadDirectory, constants.R_OK | constants.W_OK);
    return { ready: true, downloadDirectory };
  } catch {
    return { ready: false, reason: "download-directory-unavailable" };
  }
}
