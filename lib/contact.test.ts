import { describe, expect, it } from "vitest";
import { indianMobile, isValidEmail } from "./contact";

describe("indianMobile", () => {
  it("accepts 10-digit mobiles starting 6-9", () => {
    expect(indianMobile("9876543210")).toBe("9876543210");
    expect(indianMobile("6000000000")).toBe("6000000000");
  });
  it("strips spaces, dashes, +91 and a leading 0", () => {
    expect(indianMobile("+91 98765 43210")).toBe("9876543210");
    expect(indianMobile("098765-43210")).toBe("9876543210");
    expect(indianMobile("91 9876543210")).toBe("9876543210");
  });
  it("rejects landlines, short numbers and non-strings", () => {
    expect(indianMobile("5876543210")).toBeNull();
    expect(indianMobile("98765")).toBeNull();
    expect(indianMobile("98765432101")).toBeNull();
    expect(indianMobile(9876543210)).toBeNull();
    expect(indianMobile(undefined)).toBeNull();
  });
});

describe("isValidEmail", () => {
  it("needs a domain with an extension", () => {
    expect(isValidEmail("name@example.com")).toBe(true);
    expect(isValidEmail("  name@example.in ")).toBe(true);
    expect(isValidEmail("name@example")).toBe(false);
    expect(isValidEmail("not an email")).toBe(false);
    expect(isValidEmail(42)).toBe(false);
  });
});
