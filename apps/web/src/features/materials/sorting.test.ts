import { describe, expect, it } from "vitest";
import { sortParamsFrom, sortingFromParams } from "./sorting.ts";

describe("sorting", () => {
  it("turns the URL sort into one TanStack sorting entry", () => {
    expect(sortingFromParams("unitPrice", "desc")).toEqual([{ id: "unitPrice", desc: true }]);
    expect(sortingFromParams("materialNumber", "asc")).toEqual([
      { id: "materialNumber", desc: false },
    ]);
  });

  it("turns a TanStack sorting entry back into URL params", () => {
    expect(sortParamsFrom([{ id: "stockOnHand", desc: true }])).toEqual({
      sort: "stockOnHand",
      dir: "desc",
    });
    expect(sortParamsFrom([{ id: "updatedAt", desc: false }])).toEqual({
      sort: "updatedAt",
      dir: "asc",
    });
  });

  it("ignores columns that the API cannot sort by, and empty sorting", () => {
    expect(sortParamsFrom([{ id: "plant", desc: false }])).toBeUndefined();
    expect(sortParamsFrom([])).toBeUndefined();
  });
});
