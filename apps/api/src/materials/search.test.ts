import { materialListInput } from "@lexin/shared";
import { describe, expect, it } from "vitest";
import { connectTestDb } from "../test/db.ts";
import { fixtureMaterials } from "../test/fixture.ts";
import { listMaterials } from "./list.ts";
import { searchWhere } from "./search.ts";

const db = connectTestDb();

/** Material numbers matching `q`, in the default (material number) order. */
async function search(q: string): Promise<string[]> {
  const { rows } = await listMaterials(db, materialListInput.parse({ q }));
  return rows.map((row) => row.materialNumber);
}

describe("searchWhere", () => {
  it("returns no condition for empty or whitespace-only input", () => {
    expect(searchWhere("")).toBeUndefined();
    expect(searchWhere("   ")).toBeUndefined();
  });

  it("returns every material for an empty search", async () => {
    expect(await search("")).toHaveLength(fixtureMaterials.length);
  });

  it("matches case-insensitively", async () => {
    const expected = ["MAT-000104", "MAT-000109", "MAT-000110", "MAT-000117"];
    expect(await search("bearing")).toEqual(expected);
    expect(await search("BeArInG")).toEqual(expected);
  });

  it("requires every word to match, each in any of the searched fields", async () => {
    // "skf" is in no searched field, so it excludes everything.
    expect(await search("bearing skf")).toEqual([]);
    // "bearing" is in the description, "6205" only in the MPN.
    expect(await search("bearing 6205")).toEqual(["MAT-000110"]);
    // "000117" is only in the material number. Extra whitespace is ignored.
    expect(await search("  housing   000117 ")).toEqual(["MAT-000117"]);
  });

  it("matches on MPN alone", async () => {
    expect(await search("quantum")).toEqual(["MAT-000102"]);
  });

  it("matches on material number", async () => {
    expect(await search("mat-00011")).toEqual([
      "MAT-000110",
      "MAT-000111",
      "MAT-000112",
      "MAT-000113",
      "MAT-000114",
      "MAT-000115",
      "MAT-000116",
      "MAT-000117",
      "MAT-000118",
      "MAT-000119",
    ]);
  });

  it("treats % and _ literally instead of as wildcards", async () => {
    expect(await search("%")).toEqual(["MAT-000113"]);
    expect(await search("_")).toEqual(["MAT-000108"]);
    expect(await search("black_uv")).toEqual(["MAT-000108"]);
    // Unescaped, "_" would match any character and "black uv" would not need it.
    expect(await search("100%synthetic")).toEqual([]);
  });

  it("treats a backslash literally", async () => {
    expect(await search("\\")).toEqual([]);
  });
});
