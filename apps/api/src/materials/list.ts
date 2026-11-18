import { schema, type Db } from "@lexin/db";
import type { MaterialListInput } from "@lexin/shared";
import { and, count, eq } from "drizzle-orm";
import { filterWhere } from "./filters.ts";
import { searchWhere } from "./search.ts";
import { orderByFor } from "./sort.ts";

const { manufacturers, materials, plants } = schema;

/**
 * One page of materials plus the total match count. Both queries share the same
 * joins and `where`, so the total always describes the rows being paged through.
 */
export async function listMaterials(db: Db, input: MaterialListInput) {
  const where = and(searchWhere(input.q), filterWhere(input));

  const [rows, totals] = await Promise.all([
    db
      .select({
        id: materials.id,
        materialNumber: materials.materialNumber,
        description: materials.description,
        type: materials.type,
        status: materials.status,
        manufacturerName: manufacturers.name,
        mpn: materials.mpn,
        plantCode: plants.code,
        plantName: plants.name,
        unitOfMeasure: materials.unitOfMeasure,
        unitPrice: materials.unitPrice,
        stockOnHand: materials.stockOnHand,
        updatedAt: materials.updatedAt,
      })
      .from(materials)
      .innerJoin(manufacturers, eq(materials.manufacturerId, manufacturers.id))
      .innerJoin(plants, eq(materials.plantId, plants.id))
      .where(where)
      .orderBy(...orderByFor(input.sort, input.dir))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize),
    db
      .select({ total: count() })
      .from(materials)
      .innerJoin(manufacturers, eq(materials.manufacturerId, manufacturers.id))
      .innerJoin(plants, eq(materials.plantId, plants.id))
      .where(where),
  ]);

  return {
    // Dates go over the wire as ISO strings; tRPC has no transformer configured.
    rows: rows.map((row) => ({ ...row, updatedAt: row.updatedAt.toISOString() })),
    total: totals[0]?.total ?? 0,
    page: input.page,
    pageSize: input.pageSize,
  };
}
