import { describe, it, expect } from "vitest";
import { isValidEmail, slugify } from "../src/string-utils";

describe("isValidEmail", () => {
  it("returns true for standard emails (user@domain.com)", () => {
    expect(isValidEmail("user@domain.com")).toBe(true);
    expect(isValidEmail("test@example.org")).toBe(true);
    expect(isValidEmail("foo.bar@sub.domain.co.uk")).toBe(true);
  });

  it("returns false for malformed inputs (no @, no domain, empty string)", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("no-at-sign.com")).toBe(false);
    expect(isValidEmail("missing-domain@")).toBe(false);
    expect(isValidEmail("@nodomain.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
  });

  it("returns false for multiple @ symbols", () => {
    expect(isValidEmail("user@@domain.com")).toBe(false);
    expect(isValidEmail("@user@domain.com")).toBe(false);
  });
});

describe("slugify", () => {
  it("converts 'Hello World!' to 'hello-world'", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });

  it("is idempotent: slugify(slugify(x)) === slugify(x)", () => {
    const inputs = ["Hello World!", "Foo Bar", "  spaces  ", "hello-world"];
    for (const input of inputs) {
      expect(slugify(slugify(input))).toBe(slugify(input));
    }
  });

  it("handles unicode by stripping non-ASCII", () => {
    expect(slugify("Héllo Wörld")).toBe("hllo-wrld");
    expect(slugify("日本語")).toBe("");
    expect(slugify("Café résumé")).toBe("caf-rsum");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles whitespace", () => {
    expect(slugify("   ")).toBe("");
    expect(slugify("  hello  world  ")).toBe("hello-world");
  });

  it("handles consecutive special chars", () => {
    expect(slugify("hello---world")).toBe("hello-world");
    expect(slugify("hello   world")).toBe("hello-world");
    expect(slugify("!!!hello!!!world!!!")).toBe("hello-world");
  });
});
