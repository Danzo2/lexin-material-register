import { materialListInput } from "@lexin/shared";
import { describe, expect, it } from "vitest";
import { connectTestDb } from "../test/db.ts";
import { fixtureMaterials } from "../test/fixture.ts";
import { listMaterials } from "./list.ts";

const db = connectTestDb();
const defaults = materialListInput.parse({});

describe("listMaterials", () => {
  it("returns the first page in material number order with the total", async () => {
    const result = await listMaterials(db, defaults);

    expect(result.total).toBe(fixtureMaterials.length);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(50);
    const expected = fixtureMaterials.map((m) => m.materialNumber).sort();
    expect(result.rows.map((r) => r.materialNumber)).toEqual(expected);
  });

  it("returns flat rows with the plant and manufacturer joined in", async () => {
    const { rows } = await listMaterials(db, defaults);

    expect(rows[0]).toEqual({
      id: 4,
      materialNumber: "MAT-000101",
      description: "Hydraulic hose, 1/2in, 2-wire braid",
      type: "spare_part",
      status: "active",
      manufacturerName: "Parker Hannifin",
      mpn: "471TC-8",
      plantCode: "1000",
      plantName: "Brisbane",
      unitOfMeasure: "M",
      unitPrice: "12.75",
      stockOnHand: 300,
      updatedAt: "2026-07-21T09:00:00.000Z",
    });
  });

  it("slices pages with limit and offset while the total stays the same", async () => {
    const page1 = await listMaterials(db, { ...defaults, pageSize: 25 });
    const page2 = await listMaterials(db, { ...defaults, pageSize: 25, page: 2 });

    expect(page1.rows).toHaveLength(20);
    expect(page2.rows).toEqual([]);
    expect(page2.total).toBe(20);
  });
});
