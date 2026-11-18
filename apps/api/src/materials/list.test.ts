import { schema } from "@lexin/db";
import { materialListInput } from "@lexin/shared";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { describe, expect, inject, it } from "vitest";
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

  it("returns no rows but the full total for a page past the end", async () => {
    const pastEnd = await listMaterials(db, { ...defaults, page: 999 });

    expect(pastEnd.rows).toEqual([]);
    expect(pastEnd.total).toBe(fixtureMaterials.length);
    expect(pastEnd.page).toBe(999);
  });

  it("counts only filtered matches in total, including past the end", async () => {
    const skf = { ...defaults, manufacturer: ["skf"] };
    const firstPage = await listMaterials(db, skf);
    const pastEnd = await listMaterials(db, { ...skf, page: 999 });

    expect(firstPage.total).toBe(6);
    expect(firstPage.rows).toHaveLength(6);
    expect(pastEnd.rows).toEqual([]);
    expect(pastEnd.total).toBe(6);
  });

  it("combines search and filters in one where clause (the brief's demo query)", async () => {
    const result = await listMaterials(db, {
      ...defaults,
      q: "bearing",
      manufacturer: ["skf"],
      plant: ["1000"],
      status: ["active"],
    });

    expect(result.rows.map((r) => r.materialNumber)).toEqual(["MAT-000109", "MAT-000110"]);
    expect(result.total).toBe(2);
  });
});

describe("listMaterials paging over more rows than one page", () => {
  // The fixture has 20 rows and the smallest page size is 25, so these tests add
  // 40 rows inside a transaction and roll it back. A pool of one connection keeps
  // every query on that transaction, and other test files never see the rows.
  const extraCount = 40;
  const extraNumbers = Array.from(
    { length: extraCount },
    (_, i) => `MAT-9${String(i + 1).padStart(5, "0")}`,
  );

  async function withExtraRows(run: (txDb: typeof db) => Promise<void>): Promise<void> {
    const txDb = drizzle({
      connection: { connectionString: inject("databaseUrl"), max: 1 },
      schema,
    });
    try {
      await txDb.execute(sql`begin`);
      const [plant] = await txDb
        .insert(schema.plants)
        .values({ code: "9000", name: "Darwin" })
        .returning();
      const [manufacturer] = await txDb
        .insert(schema.manufacturers)
        .values({ slug: "paging-test", name: "Paging Test Co" })
        .returning();
      if (plant === undefined || manufacturer === undefined) throw new Error("Insert failed");
      await txDb.insert(schema.materials).values(
        extraNumbers.map((materialNumber) => ({
          materialNumber,
          description: `Paging test item ${materialNumber}`,
          type: "spare_part" as const,
          manufacturerId: manufacturer.id,
          mpn: materialNumber,
          plantId: plant.id,
          status: "active" as const,
          unitOfMeasure: "EA",
          unitPrice: "1.00",
          stockOnHand: 1,
          updatedAt: new Date("2026-01-01T00:00:00Z"),
        })),
      );
      await run(txDb);
    } finally {
      await txDb.execute(sql`rollback`);
      await txDb.$client.end();
    }
  }

  it("returns the requested slice for each page and page size", async () => {
    await withExtraRows(async (txDb) => {
      const allNumbers = [...fixtureMaterials.map((m) => m.materialNumber), ...extraNumbers].sort();

      const page2 = await listMaterials(txDb, { ...defaults, pageSize: 25, page: 2 });
      const page3 = await listMaterials(txDb, { ...defaults, pageSize: 25, page: 3 });
      const bigPage = await listMaterials(txDb, { ...defaults, pageSize: 100 });

      expect(page2.total).toBe(60);
      expect(page2.rows.map((r) => r.materialNumber)).toEqual(allNumbers.slice(25, 50));
      expect(page3.rows.map((r) => r.materialNumber)).toEqual(allNumbers.slice(50, 60));
      expect(bigPage.rows).toHaveLength(60);
    });
  });
});
