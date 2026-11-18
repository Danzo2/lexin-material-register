// Deterministic seed: a fixed faker seed, batched inserts, and truncate-and-refill
// so running it twice gives the same database. Row count comes from SEED_ROWS.
// The realistic catalogue data (plants, manufacturers, category templates) lives in ./seed/.
import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";
import { createDb } from "./client.ts";
import { databaseUrl } from "./env.ts";
import { manufacturers, materials, plants } from "./schema.ts";
import { manufacturers as manufacturerRows } from "./seed/manufacturers.ts";
import { createMaterialBuilder } from "./seed/materials.ts";
import { plants as plantRows } from "./seed/plants.ts";

const FAKER_SEED = 20261118;
// 1,000 rows x 13 columns stays well under Postgres's 65,535 bind-parameter limit.
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

function lookup<K, V>(map: Map<K, V>, key: K): V {
  const value = map.get(key);
  if (value === undefined) throw new Error(`Seed reference "${String(key)}" was not inserted`);
  return value;
}

const startedAt = performance.now();
const rowCount = seedRowCount();
faker.seed(FAKER_SEED);

const { db, pool } = createDb(databaseUrl());
try {
  // One transaction, so a failed seed leaves the previous data in place.
  await db.transaction(async (tx) => {
    await tx.execute(sql`truncate table materials, manufacturers, plants restart identity cascade`);

    const insertedPlants = await tx
      .insert(plants)
      .values(plantRows.map(({ code, name }) => ({ code, name })))
      .returning({ id: plants.id, code: plants.code });
    const plantIdByCode = new Map(insertedPlants.map((p) => [p.code, p.id]));

    const insertedManufacturers = await tx
      .insert(manufacturers)
      .values(manufacturerRows.map(({ slug, name }) => ({ slug, name })))
      .returning({ id: manufacturers.id, slug: manufacturers.slug });
    const manufacturerIdBySlug = new Map(insertedManufacturers.map((m) => [m.slug, m.id]));

    const buildMaterial = createMaterialBuilder();
    for (let start = 0; start < rowCount; start += BATCH_SIZE) {
      const batch = Array.from({ length: Math.min(BATCH_SIZE, rowCount - start) }, (_, i) => {
        const { manufacturerSlug, plantCode, ...material } = buildMaterial(start + i);
        return {
          ...material,
          manufacturerId: lookup(manufacturerIdBySlug, manufacturerSlug),
          plantId: lookup(plantIdByCode, plantCode),
        };
      });
      await tx.insert(materials).values(batch);
    }
  });

  const seconds = ((performance.now() - startedAt) / 1000).toFixed(1);
  console.log(
    `Seeded ${plantRows.length} plants, ${manufacturerRows.length} manufacturers, ${rowCount.toLocaleString("en-AU")} materials in ${seconds}s.`,
  );
} finally {
  await pool.end();
}
