import { schema } from "@lexin/db";
import type { MaterialListInput } from "@lexin/shared";
import { and, inArray, type SQL } from "drizzle-orm";

const { manufacturers, materials, plants } = schema;

/**
 * Filter condition for type, status, plant and manufacturer. Values within one
 * filter are ORed (`IN (...)`), different filters are ANDed. Plant and
 * manufacturer match on the joined tables' public keys (code, slug), so the
 * query must join plants and manufacturers. Undefined means "no condition".
 */
export function filterWhere(input: MaterialListInput): SQL | undefined {
  const conditions: SQL[] = [];
  if (input.type.length > 0) conditions.push(inArray(materials.type, input.type));
  if (input.status.length > 0) conditions.push(inArray(materials.status, input.status));
  if (input.plant.length > 0) conditions.push(inArray(plants.code, input.plant));
  if (input.manufacturer.length > 0) {
    conditions.push(inArray(manufacturers.slug, input.manufacturer));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}
