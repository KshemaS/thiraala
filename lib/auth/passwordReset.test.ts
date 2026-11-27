import { beforeAll, describe, expect, it } from "vitest";
import { createResetToken, readResetToken, resetSignatureValid } from "./passwordReset";

beforeAll(() => {
  process.env.AUTH_SECRET = "x".repeat(40);
});

const encode = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");

describe("password reset links", () => {
  it("round-trips the user id while the password is unchanged", () => {
    const t = createResetToken("user1", "scrypt$old");
    expect(readResetToken(t)).toBe("user1");
    expect(resetSignatureValid(t, "scrypt$old")).toBe(true);
  });

  it("stops working once the password has been changed (single use)", () => {
    const t = createResetToken("user1", "scrypt$old");
    expect(resetSignatureValid(t, "scrypt$new")).toBe(false);
  });

  it("can't be edited to point at another account", () => {
    const [, sig] = createResetToken("user1", "h").split(".");
    const forged = `${encode({ sub: "user2", exp: 9_999_999_999 })}.${sig}`;
    expect(resetSignatureValid(forged, "h")).toBe(false);
  });

  it("rejects expired and malformed tokens", () => {
    expect(readResetToken(`${encode({ sub: "user1", exp: 1 })}.sig`)).toBeNull();
    expect(readResetToken("garbage")).toBeNull();
    expect(readResetToken(123)).toBeNull();
    expect(readResetToken("a.b.c")).toBeNull();
  });
});
