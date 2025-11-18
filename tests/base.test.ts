import { describe, it, expect } from "vitest";
import { genCode } from "@/lib/base";

const alphabet = new Set(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
);

describe("genCode", () => {
  it("creates 9-char strings", () => {
    const s = genCode(9);
    expect(s).toHaveLength(9);
  });
  it("uses base62 characters only", () => {
    const s = genCode(9);
    expect([...s].every((c) => alphabet.has(c))).toBe(true);
  });
  it("is unlikely to collide across many generations", () => {
    const set = new Set<string>();
    for (let i = 0; i < 10000; i++) set.add(genCode(9));
    expect(set.size).toBe(10000);
  });
});
