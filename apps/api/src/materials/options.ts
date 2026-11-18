import { schema, type Db } from "@lexin/db";
import { asc } from "drizzle-orm";

const { manufacturers, plants } = schema;

/** Choices for the plant and manufacturer filters. Small tables, so no paging. */
export async function filterOptions(db: Db) {
  const [plantRows, manufacturerRows] = await Promise.all([
    db.select({ code: plants.code, name: plants.name }).from(plants).orderBy(asc(plants.code)),
    db
      .select({ slug: manufacturers.slug, name: manufacturers.name })
      .from(manufacturers)
      .orderBy(asc(manufacturers.name)),
  ]);
  return { plants: plantRows, manufacturers: manufacturerRows };
}
