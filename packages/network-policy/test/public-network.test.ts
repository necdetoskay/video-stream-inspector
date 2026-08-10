import { describe, expect, it } from "vitest";
import { assertPublicHttpUrl, isPublicAddress, type HostResolver } from "../src/index";

const resolvesTo = (...addresses: string[]): HostResolver => async () =>
  addresses.map((address) => ({ address, family: address.includes(":") ? 6 : 4 }));

describe("public network policy", () => {
  it("NETWORK-001 recognizes public addresses", () => {
    expect(isPublicAddress("1.1.1.1")).toBe(true);
    expect(isPublicAddress("2606:4700:4700::1111")).toBe(true);
  });

  it.each(["127.0.0.1", "10.0.0.5", "192.168.1.2", "169.254.1.1", "::1", "fc00::1", "fe80::1"])(
    "NETWORK-002 blocks private/reserved address %s",
    (address) => expect(isPublicAddress(address)).toBe(false),
  );

  it("NETWORK-003 rejects localhost names", async () => {
    await expect(assertPublicHttpUrl("http://localhost:3000/", resolvesTo("1.1.1.1")))
      .rejects.toThrow("Localhost targets");
  });

  it("NETWORK-004 rejects DNS resolving to private address", async () => {
    await expect(assertPublicHttpUrl("https://example.test/", resolvesTo("10.0.0.8")))
      .rejects.toThrow("Private or reserved");
  });

  it("NETWORK-005 rejects mixed public/private DNS answers", async () => {
    await expect(assertPublicHttpUrl("https://example.test/", resolvesTo("1.1.1.1", "192.168.1.4")))
      .rejects.toThrow("Private or reserved");
  });

  it("NETWORK-006 accepts a public-only target", async () => {
    const result = await assertPublicHttpUrl("https://example.test/path", resolvesTo("1.1.1.1"));
    expect(result.href).toBe("https://example.test/path");
  });

  it("NETWORK-007 rejects credential-bearing URLs", async () => {
    await expect(assertPublicHttpUrl("https://user:pass@example.test/", resolvesTo("1.1.1.1")))
      .rejects.toThrow("Credential-bearing");
  });
});
