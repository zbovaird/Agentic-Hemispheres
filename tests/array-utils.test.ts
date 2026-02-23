import { describe, it, expect } from "vitest";
import { unique, chunk } from "../src/array-utils";

describe("unique", () => {
  it("unique([1,2,2,3]) returns [1,2,3]", () => {
    expect(unique([1, 2, 2, 3])).toEqual([1, 2, 3]);
  });

  it("unique preserves insertion order", () => {
    expect(unique([3, 1, 2, 1, 3, 2])).toEqual([3, 1, 2]);
  });

  it("unique works with strings", () => {
    expect(unique(["a", "b", "b", "c", "a"])).toEqual(["a", "b", "c"]);
  });
});

describe("chunk", () => {
  it("chunk([1,2,3,4,5], 2) returns [[1,2],[3,4],[5]]", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("chunk handles empty arrays", () => {
    expect(chunk([], 2)).toEqual([]);
  });

  it("chunk must handle async iterables", async () => {
    async function* asyncGen(): AsyncIterable<number> {
      yield 1;
      yield 2;
      yield 3;
    }
    const result = await chunk(asyncGen(), 2);
    expect(result).toEqual([[1, 2], [3]]);
  });
});
