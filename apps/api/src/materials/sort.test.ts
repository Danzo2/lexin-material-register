import { schema } from "@lexin/db";
import type { SortColumn, SortDirection } from "@lexin/shared";
import { describe, expect, it } from "vitest";
import { connectTestDb } from "../test/db.ts";
import { orderByFor } from "./sort.ts";

const db = connectTestDb();
const { materials } = schema;

/** Material numbers in sort order, optionally sliced like a page. */
async function sortedNumbers(
  sort: SortColumn,
  dir: SortDirection,
  page: { limit: number; offset: number } = { limit: 100, offset: 0 },
): Promise<string[]> {
  const rows = await db
    .select({ materialNumber: materials.materialNumber })
    .from(materials)
    .orderBy(...orderByFor(sort, dir))
    .limit(page.limit)
    .offset(page.offset);
  return rows.map((row) => row.materialNumber);
}

describe("orderByFor", () => {
  // First rows of the fixture for each column and direction, worked out by hand.
  const cases: [SortColumn, SortDirection, string[]][] = [
    ["materialNumber", "asc", ["MAT-000101", "MAT-000102", "MAT-000103"]],
    ["materialNumber", "desc", ["MAT-000120", "MAT-000119", "MAT-000118"]],
    // Abrasive, Aluminium / Torque, Tapered, Steel. The two "Bearing" descriptions
    // that come next ascending differ only by case and punctuation, so their order
    // depends on the database collation; the test stops before them.
    ["description", "asc", ["MAT-000119", "MAT-000103"]],
    ["description", "desc", ["MAT-000105", "MAT-000104", "MAT-000111"]],
    // Numeric, not text: 1.95, 3.85, 4.20 / 1290.00, 689.00, 312.00
    ["unitPrice", "asc", ["MAT-000118", "MAT-000111", "MAT-000119"]],
    ["unitPrice", "desc", ["MAT-000106", "MAT-000102", "MAT-000105"]],
    // 2, 3, 4 / 5000, 2400, 900
    ["stockOnHand", "asc", ["MAT-000106", "MAT-000115", "MAT-000105"]],
    ["stockOnHand", "desc", ["MAT-000111", "MAT-000118", "MAT-000119"]],
    // 2024-06-01, 2024-11-20, 2025-02-28 / 2026-11-01, 2026-10-01, 2026-09-12
    ["updatedAt", "asc", ["MAT-000118", "MAT-000115", "MAT-000120"]],
    ["updatedAt", "desc", ["MAT-000112", "MAT-000110", "MAT-000102"]],
  ];

  it.each(cases)("sorts by %s %s", async (sort, dir, expectedFirst) => {
    const numbers = await sortedNumbers(sort, dir);
    expect(numbers.slice(0, expectedFirst.length)).toEqual(expectedFirst);
  });

  // MAT-000116 and MAT-000107 tie on price and stock. MAT-000116 has the lower id,
  // so it comes first in both directions even though its material number is higher.
  it.each<[SortColumn, SortDirection]>([
    ["unitPrice", "asc"],
    ["unitPrice", "desc"],
    ["stockOnHand", "asc"],
    ["stockOnHand", "desc"],
  ])("breaks the %s %s tie by id ascending", async (sort, dir) => {
    const numbers = await sortedNumbers(sort, dir);
    const first = numbers.indexOf("MAT-000116");
    expect(first).toBeGreaterThanOrEqual(0);
    expect(numbers[first + 1]).toBe("MAT-000107");
  });

  it("keeps a tie split across a page boundary on separate pages", async () => {
    // The two 31.20 rows sit 10th and 11th by price, so a page of 10 splits them.
    const page1 = await sortedNumbers("unitPrice", "asc", { limit: 10, offset: 0 });
    const page2 = await sortedNumbers("unitPrice", "asc", { limit: 10, offset: 10 });

    expect(page1.at(-1)).toBe("MAT-000116");
    expect(page2[0]).toBe("MAT-000107");
    expect(page1.filter((n) => page2.includes(n))).toEqual([]);
    expect(new Set([...page1, ...page2]).size).toBe(20);
  });
});
