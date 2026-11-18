import { materialListInput, type MaterialListInput } from "@lexin/shared";
import { describe, expect, it } from "vitest";
import { connectTestDb } from "../test/db.ts";
import { filterWhere } from "./filters.ts";
import { listMaterials } from "./list.ts";

const db = connectTestDb();
const defaults = materialListInput.parse({});

/** Material numbers returned for the given filters, in default (material number) order. */
async function numbersFor(patch: Partial<MaterialListInput>): Promise<string[]> {
  const { rows } = await listMaterials(db, { ...defaults, ...patch });
  return rows.map((row) => row.materialNumber);
}

describe("filterWhere", () => {
  it("returns undefined when no filter is set", () => {
    expect(filterWhere(defaults)).toBeUndefined();
  });

  it("filters by a single type", async () => {
    expect(await numbersFor({ type: ["tool"] })).toEqual([
      "MAT-000102",
      "MAT-000105",
      "MAT-000106",
      "MAT-000115",
    ]);
  });

  it("filters by a single status", async () => {
    expect(await numbersFor({ status: ["pending_review"] })).toEqual([
      "MAT-000105",
      "MAT-000106",
      "MAT-000113",
    ]);
  });

  it("filters by plant code through the plants join", async () => {
    expect(await numbersFor({ plant: ["3000"] })).toEqual([
      "MAT-000106",
      "MAT-000112",
      "MAT-000113",
      "MAT-000116",
      "MAT-000118",
      "MAT-000119",
    ]);
  });

  it("filters by manufacturer slug through the manufacturers join", async () => {
    expect(await numbersFor({ manufacturer: ["fluke"] })).toEqual([
      "MAT-000102",
      "MAT-000106",
      "MAT-000115",
    ]);
  });

  it("matches any of several values within one filter (OR)", async () => {
    expect(await numbersFor({ status: ["obsolete", "pending_review"] })).toEqual([
      "MAT-000104",
      "MAT-000105",
      "MAT-000106",
      "MAT-000113",
      "MAT-000115",
      "MAT-000118",
      "MAT-000120",
    ]);
  });

  it("requires every filter to match when combined (AND)", async () => {
    expect(
      await numbersFor({ type: ["spare_part"], status: ["active"], plant: ["1000", "2000"] }),
    ).toEqual(["MAT-000101", "MAT-000110", "MAT-000114", "MAT-000117"]);
  });

  it("combines with search: active bearings from SKF at Brisbane", async () => {
    // Every row these filters keep mentions "bearing", so the expectation holds
    // whether or not search narrows further.
    const result = await listMaterials(db, {
      ...defaults,
      q: "bearing",
      status: ["active"],
      manufacturer: ["skf"],
      plant: ["1000"],
    });

    expect(result.rows.map((row) => row.materialNumber)).toEqual(["MAT-000109", "MAT-000110"]);
    expect(result.total).toBe(2);
  });

  it("returns no rows for an unknown plant code", async () => {
    const result = await listMaterials(db, { ...defaults, plant: ["9999"] });

    expect(result.rows).toEqual([]);
    expect(result.total).toBe(0);
  });
});
