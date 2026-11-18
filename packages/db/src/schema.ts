// Drizzle schema: the single source of truth for tables, enums and indexes.
// After editing, run `pnpm db:generate` and commit the SQL in ../drizzle.

import { materialStatuses, materialTypes } from "@lexin/shared";
import {
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// Built from the shared lists so the database, API and UI can't disagree on values.
export const materialType = pgEnum("material_type", materialTypes);
export const materialStatus = pgEnum("material_status", materialStatuses);

export const plants = pgTable("plants", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  code: varchar({ length: 4 }).notNull().unique(),
  name: text().notNull(),
});

export const manufacturers = pgTable("manufacturers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  slug: varchar({ length: 64 }).notNull().unique(),
  name: text().notNull().unique(),
});

export const materials = pgTable(
  "materials",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    // The unique constraint's index also covers sorting by material number.
    materialNumber: varchar("material_number", { length: 20 }).notNull().unique(),
    description: text().notNull(),
    type: materialType().notNull(),
    manufacturerId: integer("manufacturer_id")
      .notNull()
      .references(() => manufacturers.id),
    mpn: text().notNull(),
    plantId: integer("plant_id")
      .notNull()
      .references(() => plants.id),
    status: materialStatus().notNull(),
    unitOfMeasure: varchar("unit_of_measure", { length: 8 }).notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    stockOnHand: integer("stock_on_hand").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // One btree per filtered or sorted column (see README for the reasoning).
  (table) => [
    index("materials_type_idx").on(table.type),
    index("materials_status_idx").on(table.status),
    index("materials_plant_id_idx").on(table.plantId),
    index("materials_manufacturer_id_idx").on(table.manufacturerId),
    index("materials_description_idx").on(table.description),
    index("materials_unit_price_idx").on(table.unitPrice),
    index("materials_stock_on_hand_idx").on(table.stockOnHand),
    index("materials_updated_at_idx").on(table.updatedAt),
  ],
);
