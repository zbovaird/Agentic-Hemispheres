import { describe, it, expect } from "vitest";
import { unique, chunk } from "../src/array-utils";

describe("unique", () => {
  it("removes duplicates from number arrays", () => {
    expect(unique([1, 2, 2, 3])).toEqual([1, 2, 3]);
  });

  it("preserves first-occurrence order", () => {
    expect(unique([3, 1, 2, 1, 3, 2])).toEqual([3, 1, 2]);
  });

  it("removes duplicates from string arrays", () => {
    expect(unique(["a", "b", "b", "c", "a"])).toEqual(["a", "b", "c"]);
  });

  it("handles mixed types using strict equality", () => {
    expect(unique([1, "1", 2, "2", 1, "1"])).toEqual([1, "1", 2, "2"]);
  });

  it("returns empty array for empty input", () => {
    expect(unique([])).toEqual([]);
  });

  it("returns same elements when no duplicates exist", () => {
    expect(unique([1, 2, 3])).toEqual([1, 2, 3]);
  });
});

describe("chunk", () => {
  it("splits array into sub-arrays of specified size", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns empty array for empty input", () => {
    expect(chunk([], 2)).toEqual([]);
  });

  it("returns single chunk when size exceeds array length", () => {
    expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  it("returns single-element chunks when size is 1", () => {
    expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });

  it("returns single chunk when size equals array length", () => {
    expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
  });

  it("returns empty array when size is zero or negative", () => {
    expect(chunk([1, 2, 3], 0)).toEqual([]);
    expect(chunk([1, 2, 3], -1)).toEqual([]);
  });
});
