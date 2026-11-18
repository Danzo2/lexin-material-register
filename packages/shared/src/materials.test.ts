import { describe, expect, it } from "vitest";
import {
  materialListInput,
  parseListSearchParams,
  toListSearchParams,
  type MaterialListInput,
} from "./materials.ts";

const defaults: MaterialListInput = {
  q: "",
  type: [],
  status: [],
  plant: [],
  manufacturer: [],
  sort: "materialNumber",
  dir: "asc",
  page: 1,
  pageSize: 50,
};

function parse(query: string): MaterialListInput {
  return parseListSearchParams(new URLSearchParams(query));
}

describe("materialListInput", () => {
  it("fills every default from an empty object", () => {
    expect(materialListInput.parse({})).toEqual(defaults);
  });

  it("trims q and rejects one over 100 characters", () => {
    expect(materialListInput.parse({ q: "  bearing  " }).q).toBe("bearing");
    expect(materialListInput.safeParse({ q: "x".repeat(101) }).success).toBe(false);
  });

  it("rejects bad values instead of guessing", () => {
    expect(materialListInput.safeParse({ page: 0 }).success).toBe(false);
    expect(materialListInput.safeParse({ page: 1.5 }).success).toBe(false);
    expect(materialListInput.safeParse({ pageSize: 30 }).success).toBe(false);
    expect(materialListInput.safeParse({ sort: "mpn" }).success).toBe(false);
    expect(materialListInput.safeParse({ status: ["bogus"] }).success).toBe(false);
    expect(materialListInput.safeParse({ plant: ["10000"] }).success).toBe(false);
    expect(materialListInput.safeParse({ manufacturer: ["SKF; drop"] }).success).toBe(false);
  });
});

describe("parseListSearchParams", () => {
  it("returns defaults for an empty URL", () => {
    expect(parse("")).toEqual(defaults);
  });

  it("coerces numeric strings", () => {
    expect(parse("page=3&pageSize=100")).toMatchObject({ page: 3, pageSize: 100 });
  });

  it("splits comma lists", () => {
    expect(
      parse("type=tool,consumable&status=active,pending_review&plant=1000,2000"),
    ).toMatchObject({
      type: ["tool", "consumable"],
      status: ["active", "pending_review"],
      plant: ["1000", "2000"],
    });
    expect(parse("manufacturer=skf,parker-hannifin").manufacturer).toEqual([
      "skf",
      "parker-hannifin",
    ]);
  });

  it("falls back per field and drops unknown list values", () => {
    expect(parse("page=-2&status=active,bogus&sort=description")).toEqual({
      ...defaults,
      status: ["active"],
      sort: "description",
    });
  });

  it("falls back for each kind of bad value", () => {
    expect(
      parse("page=abc&pageSize=30&sort=mpn&dir=up&plant=10,1000&q=" + "x".repeat(101)),
    ).toEqual({ ...defaults, plant: ["1000"] });
  });

  it("deduplicates list values", () => {
    expect(parse("type=tool,tool").type).toEqual(["tool"]);
  });
});

describe("toListSearchParams", () => {
  it("omits defaults", () => {
    expect(toListSearchParams(defaults).toString()).toBe("");
  });

  it("writes only non-default values, joining lists with commas", () => {
    const params = toListSearchParams({
      ...defaults,
      q: "bearing",
      status: ["active", "obsolete"],
      page: 2,
    });
    expect(Object.fromEntries(params)).toEqual({
      q: "bearing",
      status: "active,obsolete",
      page: "2",
    });
  });

  it("round-trips through parseListSearchParams", () => {
    const input: MaterialListInput = {
      q: "6205 skf",
      type: ["spare_part", "tool"],
      status: ["pending_review"],
      plant: ["1000"],
      manufacturer: ["skf", "parker-hannifin"],
      sort: "unitPrice",
      dir: "desc",
      page: 7,
      pageSize: 25,
    };
    expect(parseListSearchParams(toListSearchParams(input))).toEqual(input);
  });
});
