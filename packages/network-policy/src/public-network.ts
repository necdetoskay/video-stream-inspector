import { BlockList, isIP } from "node:net";
import { lookup } from "node:dns/promises";

export type ResolvedAddress = { address: string; family: number };
export type HostResolver = (hostname: string) => Promise<ResolvedAddress[]>;

const blocked = new BlockList();

for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blocked.addSubnet(network, prefix, "ipv4");
}

for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
  ["2001:db8::", 32],
] as const) {
  blocked.addSubnet(network, prefix, "ipv6");
}

async function defaultResolver(hostname: string): Promise<ResolvedAddress[]> {
  return lookup(hostname, { all: true, verbatim: true });
}

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !blocked.check(address, "ipv4");
  if (family === 6) return !blocked.check(address, "ipv6");
  return false;
}

export async function assertPublicHttpUrl(
  value: string,
  resolver: HostResolver = defaultResolver,
): Promise<URL> {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only public http and https URLs are allowed");
  }
  if (url.username || url.password) {
    throw new Error("Credential-bearing URLs are not allowed");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("Localhost targets are not allowed");
  }

  const literalFamily = isIP(hostname);
  const addresses = literalFamily
    ? [{ address: hostname, family: literalFamily }]
    : await resolver(hostname);

  if (addresses.length === 0) {
    throw new Error("Target hostname did not resolve");
  }

  const blockedAddress = addresses.find(({ address }) => !isPublicAddress(address));
  if (blockedAddress) {
    throw new Error(`Private or reserved network target is not allowed: ${blockedAddress.address}`);
  }

  return url;
}

export function createPublicNetworkGuard(resolver?: HostResolver) {
  return async (value: string): Promise<void> => {
    await assertPublicHttpUrl(value, resolver);
  };
}
