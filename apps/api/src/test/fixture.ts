// Hand-written fixture for query tests. Small enough to reason about exact results:
// - mixed-case "bearing" / "Bearing" / "BEARING" in descriptions
// - MPN "87V-QUANTUM" contains a term ("quantum") that no description has
// - one description with a literal "%" and one with "_" (to test ILIKE escaping)
// - every material type and status present
// - prices and stock are distinct except MAT-000116 and MAT-000107, which tie on
//   both. MAT-000116 is inserted first (lower id) but has the higher material
//   number, so the `id` tiebreaker is visible in the result order.
// - material numbers are inserted out of order and updated_at values are all different
import type { Db } from "@lexin/db";
import { schema } from "@lexin/db";
import type { MaterialStatus, MaterialType } from "@lexin/shared";

export const fixturePlants = [
  { code: "1000", name: "Brisbane" },
  { code: "2000", name: "Sydney" },
  { code: "3000", name: "Perth" },
];

export const fixtureManufacturers = [
  { slug: "skf", name: "SKF" },
  { slug: "parker-hannifin", name: "Parker Hannifin" },
  { slug: "3m", name: "3M" },
  { slug: "fluke", name: "Fluke" },
];

interface FixtureMaterial {
  materialNumber: string;
  description: string;
  type: MaterialType;
  manufacturer: string;
  mpn: string;
  plant: string;
  status: MaterialStatus;
  unitOfMeasure: string;
  unitPrice: string;
  stockOnHand: number;
  updatedAt: string;
}

// prettier-ignore
export const fixtureMaterials: FixtureMaterial[] = [
  { materialNumber: "MAT-000110", description: "Bearing, deep groove ball, 25mm bore", type: "spare_part", manufacturer: "skf", mpn: "6205-2RS1", plant: "1000", status: "active", unitOfMeasure: "EA", unitPrice: "18.40", stockOnHand: 120, updatedAt: "2026-10-01T09:00:00Z" },
  { materialNumber: "MAT-000104", description: "Tapered roller bearing, 30mm bore", type: "spare_part", manufacturer: "skf", mpn: "30206-J2", plant: "1000", status: "obsolete", unitOfMeasure: "EA", unitPrice: "42.10", stockOnHand: 8, updatedAt: "2026-03-15T09:00:00Z" },
  { materialNumber: "MAT-000117", description: "BEARING HOUSING, pillow block, cast iron", type: "spare_part", manufacturer: "skf", mpn: "SYJ-25-TF", plant: "2000", status: "active", unitOfMeasure: "EA", unitPrice: "95.00", stockOnHand: 14, updatedAt: "2025-12-02T09:00:00Z" },
  { materialNumber: "MAT-000101", description: "Hydraulic hose, 1/2in, 2-wire braid", type: "spare_part", manufacturer: "parker-hannifin", mpn: "471TC-8", plant: "1000", status: "active", unitOfMeasure: "M", unitPrice: "12.75", stockOnHand: 300, updatedAt: "2026-07-21T09:00:00Z" },
  { materialNumber: "MAT-000113", description: "Hydraulic oil additive, 100% synthetic", type: "consumable", manufacturer: "parker-hannifin", mpn: "PH-ADD-100", plant: "3000", status: "pending_review", unitOfMeasure: "L", unitPrice: "64.90", stockOnHand: 40, updatedAt: "2026-01-09T09:00:00Z" },
  { materialNumber: "MAT-000108", description: "Cable tie black_UV 300mm", type: "consumable", manufacturer: "3m", mpn: "CT300-UV", plant: "2000", status: "active", unitOfMeasure: "BOX", unitPrice: "23.50", stockOnHand: 75, updatedAt: "2025-08-30T09:00:00Z" },
  { materialNumber: "MAT-000119", description: "Abrasive cutting disc, 125mm", type: "consumable", manufacturer: "3m", mpn: "66254", plant: "3000", status: "active", unitOfMeasure: "EA", unitPrice: "4.20", stockOnHand: 900, updatedAt: "2026-05-05T09:00:00Z" },
  { materialNumber: "MAT-000102", description: "Digital multimeter, true RMS", type: "tool", manufacturer: "fluke", mpn: "87V-QUANTUM", plant: "1000", status: "active", unitOfMeasure: "EA", unitPrice: "689.00", stockOnHand: 6, updatedAt: "2026-09-12T09:00:00Z" },
  { materialNumber: "MAT-000115", description: "Clamp meter, 600A AC", type: "tool", manufacturer: "fluke", mpn: "323", plant: "2000", status: "obsolete", unitOfMeasure: "EA", unitPrice: "245.00", stockOnHand: 3, updatedAt: "2024-11-20T09:00:00Z" },
  { materialNumber: "MAT-000106", description: "Insulation tester, 1000V", type: "tool", manufacturer: "fluke", mpn: "1507", plant: "3000", status: "pending_review", unitOfMeasure: "EA", unitPrice: "1290.00", stockOnHand: 2, updatedAt: "2025-04-18T09:00:00Z" },
  { materialNumber: "MAT-000111", description: "Steel plate, 6mm, grade 350", type: "raw_material", manufacturer: "3m", mpn: "SP-6-350", plant: "1000", status: "active", unitOfMeasure: "KG", unitPrice: "3.85", stockOnHand: 5000, updatedAt: "2026-02-14T09:00:00Z" },
  { materialNumber: "MAT-000103", description: "Aluminium bar stock, 50mm round", type: "raw_material", manufacturer: "3m", mpn: "AL-50R", plant: "2000", status: "active", unitOfMeasure: "M", unitPrice: "27.30", stockOnHand: 150, updatedAt: "2025-10-10T09:00:00Z" },
  { materialNumber: "MAT-000118", description: "Copper wire, 2.5mm2 stranded", type: "raw_material", manufacturer: "parker-hannifin", mpn: "CU-25", plant: "3000", status: "obsolete", unitOfMeasure: "M", unitPrice: "1.95", stockOnHand: 2400, updatedAt: "2024-06-01T09:00:00Z" },
  { materialNumber: "MAT-000109", description: "Sealed bearing grease, 400g cartridge", type: "consumable", manufacturer: "skf", mpn: "LGMT-2-04", plant: "1000", status: "active", unitOfMeasure: "EA", unitPrice: "15.60", stockOnHand: 60, updatedAt: "2026-08-08T09:00:00Z" },
  { materialNumber: "MAT-000114", description: "O-ring kit, nitrile, metric", type: "spare_part", manufacturer: "parker-hannifin", mpn: "ORK-NBR-M", plant: "2000", status: "active", unitOfMeasure: "SET", unitPrice: "89.95", stockOnHand: 11, updatedAt: "2026-04-22T09:00:00Z" },
  { materialNumber: "MAT-000105", description: "Torque wrench, 1/2in drive, 40-200Nm", type: "tool", manufacturer: "skf", mpn: "TMWR-200", plant: "1000", status: "pending_review", unitOfMeasure: "EA", unitPrice: "312.00", stockOnHand: 4, updatedAt: "2025-06-30T09:00:00Z" },
  { materialNumber: "MAT-000116", description: "Safety glasses, clear lens", type: "consumable", manufacturer: "3m", mpn: "SF201AF", plant: "3000", status: "active", unitOfMeasure: "BOX", unitPrice: "31.20", stockOnHand: 25, updatedAt: "2026-06-17T09:00:00Z" },
  { materialNumber: "MAT-000107", description: "Duct tape, silver, 48mm", type: "consumable", manufacturer: "3m", mpn: "2929", plant: "1000", status: "active", unitOfMeasure: "BOX", unitPrice: "31.20", stockOnHand: 25, updatedAt: "2025-09-09T09:00:00Z" },
  { materialNumber: "MAT-000112", description: "Pneumatic fitting, push-in, 8mm", type: "spare_part", manufacturer: "parker-hannifin", mpn: "PF-8-PI", plant: "3000", status: "active", unitOfMeasure: "EA", unitPrice: "6.80", stockOnHand: 480, updatedAt: "2026-11-01T09:00:00Z" },
  { materialNumber: "MAT-000120", description: "Roller chain, ANSI 40, 10ft", type: "spare_part", manufacturer: "skf", mpn: "PHC-40-10", plant: "2000", status: "obsolete", unitOfMeasure: "EA", unitPrice: "54.00", stockOnHand: 20, updatedAt: "2025-02-28T09:00:00Z" },
];

function idFor(ids: Map<string, number>, key: string): number {
  const id = ids.get(key);
  if (id === undefined) throw new Error(`Fixture refers to unknown key "${key}"`);
  return id;
}

/** Inserts the fixture in array order, so material ids follow the order above. */
export async function loadFixture(db: Db): Promise<void> {
  const plants = await db.insert(schema.plants).values(fixturePlants).returning();
  const manufacturers = await db
    .insert(schema.manufacturers)
    .values(fixtureManufacturers)
    .returning();
  const plantIds = new Map(plants.map((p) => [p.code, p.id]));
  const manufacturerIds = new Map(manufacturers.map((m) => [m.slug, m.id]));

  // One insert per row keeps ids in array order, which the tiebreaker tests rely on.
  for (const { manufacturer, plant, updatedAt, ...row } of fixtureMaterials) {
    await db.insert(schema.materials).values({
      ...row,
      manufacturerId: idFor(manufacturerIds, manufacturer),
      plantId: idFor(plantIds, plant),
      updatedAt: new Date(updatedAt),
    });
  }
}
