import { faker } from "@faker-js/faker";
import { materialStatuses, materialTypes } from "@lexin/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { categories, unitsOfMeasure } from "./categories.ts";
import { manufacturers } from "./manufacturers.ts";
import { createMaterialBuilder, demoRowInterval, formatMaterialNumber } from "./materials.ts";
import type { SeedMaterial } from "./materials.ts";
import { plants } from "./plants.ts";

const sampleSize = 5000;

function sample(): SeedMaterial[] {
  const buildMaterial = createMaterialBuilder();
  return Array.from({ length: sampleSize }, (_, i) => buildMaterial(i));
}

describe("seed templates", () => {
  it("only reference manufacturers that exist, and use every manufacturer", () => {
    const known = new Set(manufacturers.map((m) => m.slug));
    const used = new Set(categories.flatMap((c) => c.makers.map((m) => m.slug)));
    for (const slug of used) expect(known.has(slug)).toBe(true);
    expect([...known].filter((slug) => !used.has(slug))).toEqual([]);
  });

  it("has ~6 plants including 1000 Brisbane, and ~30 manufacturers", () => {
    expect(plants).toContainEqual(expect.objectContaining({ code: "1000", name: "Brisbane" }));
    for (const plant of plants) expect(plant.code).toMatch(/^\d{4}$/);
    expect(manufacturers.length).toBeGreaterThanOrEqual(28);
  });
});

describe("buildMaterial", () => {
  beforeEach(() => {
    faker.seed(1);
  });

  it("is deterministic for a fixed faker seed", () => {
    const first = sample();
    faker.seed(1);
    expect(sample()).toEqual(first);
  });

  it("numbers materials MAT-000001 onwards", () => {
    expect(formatMaterialNumber(0)).toBe("MAT-000001");
    expect(sample()[41]?.materialNumber).toBe("MAT-000042");
  });

  it("produces valid enum values, units and money", () => {
    for (const row of sample()) {
      expect(materialTypes).toContain(row.type);
      expect(materialStatuses).toContain(row.status);
      expect(unitsOfMeasure).toContain(row.unitOfMeasure);
      expect(row.unitPrice).toMatch(/^\d+\.\d{2}$/);
      expect(Number(row.unitPrice)).toBeGreaterThan(0);
      expect(row.stockOnHand).toBeGreaterThanOrEqual(0);
      expect(row.mpn).not.toMatch(/[#?{}]/);
      expect(row.description).toMatch(/^[A-Z][^,]*, /);
    }
  });

  it("mixes statuses roughly 80 / 12 / 8", () => {
    const rows = sample();
    const share = (status: string) => rows.filter((r) => r.status === status).length / rows.length;
    expect(share("active")).toBeCloseTo(0.8, 1);
    expect(share("obsolete")).toBeCloseTo(0.12, 1);
    expect(share("pending_review")).toBeCloseTo(0.08, 1);
  });

  it("spreads updatedAt over the two years before 2026-11-19", () => {
    const times = sample().map((r) => r.updatedAt.getTime());
    expect(Math.min(...times)).toBeGreaterThanOrEqual(Date.parse("2024-11-19T00:00:00Z"));
    expect(Math.max(...times)).toBeLessThanOrEqual(Date.parse("2026-11-19T00:00:00Z"));
  });

  it("gives each maker + description one MPN, and each MPN one description", () => {
    const descriptionByMpn = new Map<string, string>();
    const mpnByProduct = new Map<string, string>();
    for (const row of sample()) {
      const mpnKey = `${row.manufacturerSlug}|${row.mpn}`;
      const productKey = `${row.manufacturerSlug}|${row.description}`;
      expect(descriptionByMpn.get(mpnKey) ?? row.description).toBe(row.description);
      expect(mpnByProduct.get(productKey) ?? row.mpn).toBe(row.mpn);
      descriptionByMpn.set(mpnKey, row.description);
      mpnByProduct.set(productKey, row.mpn);
    }
  });

  it("writes the described bore into deep groove bearing MPNs (6205 = 25mm)", () => {
    const deepGroove = sample().filter(
      (r) => r.manufacturerSlug === "skf" && r.description.startsWith("Bearing, deep groove ball"),
    );
    expect(deepGroove.length).toBeGreaterThan(0);
    for (const row of deepGroove) {
      const bore = Number(/(\d+)mm bore/.exec(row.description)?.[1]);
      const code = bore === 15 ? "02" : bore === 17 ? "03" : String(bore / 5).padStart(2, "0");
      expect(row.mpn.slice(2, 4)).toBe(code);
    }
  });

  it("guarantees active SKF bearings at Brisbane for the demo query", () => {
    const demoRows = sample().filter(
      (r) =>
        r.manufacturerSlug === "skf" &&
        r.plantCode === "1000" &&
        r.status === "active" &&
        r.description.startsWith("Bearing,"),
    );
    expect(demoRows.length).toBeGreaterThanOrEqual(sampleSize / demoRowInterval);
    expect(sample()[0]).toMatchObject({ manufacturerSlug: "skf", plantCode: "1000" });
  });
});
