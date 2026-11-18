// Deterministic seed: a fixed faker seed, batched inserts, and truncate-and-refill
// so running it twice gives the same database. Row count comes from SEED_ROWS.
import { faker } from "@faker-js/faker";
import { materialTypes } from "@lexin/shared";
import { sql } from "drizzle-orm";
import { createDb } from "./client.ts";
import { databaseUrl } from "./env.ts";
import { manufacturers, materials, plants } from "./schema.ts";

const BATCH_SIZE = 1000;
const DEFAULT_ROWS = 10_000;

function seedRowCount(): number {
  const raw = process.env.SEED_ROWS;
  if (raw === undefined || raw === "") return DEFAULT_ROWS;
  const rows = Number(raw);
  if (!Number.isInteger(rows) || rows < 1)
    throw new Error(`SEED_ROWS must be a positive integer, got "${raw}"`);
  return rows;
}

const plantRows = [
  { code: "1000", name: "Brisbane" },
  { code: "2000", name: "Sydney" },
  { code: "3000", name: "Melbourne" },
  { code: "4000", name: "Perth" },
  { code: "5000", name: "Adelaide" },
  { code: "6000", name: "Darwin" },
];

const manufacturerNames = [
  "SKF",
  "Timken",
  "NSK",
  "FAG",
  "NTN",
  "Parker Hannifin",
  "Bosch Rexroth",
  "Festo",
  "SMC",
  "Siemens",
  "ABB",
  "Schneider Electric",
  "Allen-Bradley",
  "Omron",
  "Danfoss",
  "Grundfos",
  "Gates",
  "Fluke",
  "3M",
  "Loctite",
  "Mobil",
  "Shell",
  "Castrol",
  "Lincoln Electric",
  "Makita",
  "Milwaukee",
  "Stanley",
  "Norton",
  "Bahco",
  "Weidmuller",
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const unitsOfMeasure = ["EA", "EA", "EA", "BOX", "KG", "L", "M", "SET"];

const { db, pool } = createDb(databaseUrl());
try {
  faker.seed(20261118);
  const rowCount = seedRowCount();

  await db.execute(sql`truncate table materials, manufacturers, plants restart identity cascade`);

  const plantIds = (await db.insert(plants).values(plantRows).returning({ id: plants.id })).map(
    (p) => p.id,
  );
  const manufacturerIds = (
    await db
      .insert(manufacturers)
      .values(manufacturerNames.map((name) => ({ name, slug: slugify(name) })))
      .returning({ id: manufacturers.id })
  ).map((m) => m.id);

  for (let start = 0; start < rowCount; start += BATCH_SIZE) {
    const batch = Array.from({ length: Math.min(BATCH_SIZE, rowCount - start) }, (_, i) => ({
      materialNumber: `MAT-${String(start + i + 1).padStart(6, "0")}`,
      description: `${faker.commerce.productAdjective()} ${faker.commerce.product()}, ${faker.commerce.productMaterial()}`,
      type: faker.helpers.arrayElement(materialTypes),
      manufacturerId: faker.helpers.arrayElement(manufacturerIds),
      mpn: faker.string.alphanumeric({ length: { min: 6, max: 10 }, casing: "upper" }),
      plantId: faker.helpers.arrayElement(plantIds),
      status: faker.helpers.weightedArrayElement([
        { weight: 7, value: "active" as const },
        { weight: 2, value: "obsolete" as const },
        { weight: 1, value: "pending_review" as const },
      ]),
      unitOfMeasure: faker.helpers.arrayElement(unitsOfMeasure),
      unitPrice: faker.commerce.price({ min: 1, max: 5000 }),
      stockOnHand: faker.number.int({ min: 0, max: 2000 }),
      updatedAt: faker.date.between({ from: "2024-01-01T00:00:00Z", to: "2026-11-01T00:00:00Z" }),
    }));
    await db.insert(materials).values(batch);
  }

  console.log(
    `Seeded ${plantRows.length} plants, ${manufacturerNames.length} manufacturers, ${rowCount} materials.`,
  );
} finally {
  await pool.end();
}
