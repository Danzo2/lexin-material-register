// The materials list contract: enum value lists, display labels, the API input
// schema, and the URL <-> input conversion the web app uses. Browser-safe.

import { z } from "zod";

export const materialTypes = ["spare_part", "consumable", "raw_material", "tool"] as const;
export type MaterialType = (typeof materialTypes)[number];
export const materialTypeLabels: Record<MaterialType, string> = {
  spare_part: "Spare Part",
  consumable: "Consumable",
  raw_material: "Raw Material",
  tool: "Tool",
};

export const materialStatuses = ["active", "obsolete", "pending_review"] as const;
export type MaterialStatus = (typeof materialStatuses)[number];
export const materialStatusLabels: Record<MaterialStatus, string> = {
  active: "Active",
  obsolete: "Obsolete",
  pending_review: "Pending Review",
};

export const sortColumns = [
  "materialNumber",
  "description",
  "unitPrice",
  "stockOnHand",
  "updatedAt",
] as const;
export type SortColumn = (typeof sortColumns)[number];

export const sortDirections = ["asc", "desc"] as const;
export type SortDirection = (typeof sortDirections)[number];

export const pageSizes = [25, 50, 100] as const;
export type PageSize = (typeof pageSizes)[number];

const plantCode = z.string().regex(/^\d{4}$/);
const manufacturerSlug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

// Element schemas for the list params, reused by parseListSearchParams to drop
// unknown values one by one instead of rejecting the whole list.
const typeValue = z.enum(materialTypes);
const statusValue = z.enum(materialStatuses);

export const materialListInput = z.object({
  q: z.string().trim().max(100).default(""),
  type: z.array(typeValue).max(materialTypes.length).default([]),
  status: z.array(statusValue).max(materialStatuses.length).default([]),
  plant: z.array(plantCode).max(50).default([]),
  manufacturer: z.array(manufacturerSlug).max(50).default([]),
  sort: z.enum(sortColumns).default("materialNumber"),
  dir: z.enum(sortDirections).default("asc"),
  page: z.int().min(1).default(1),
  pageSize: z.literal(pageSizes).default(50),
});
export type MaterialListInput = z.infer<typeof materialListInput>;

/** materials.filterOptions takes no input, but every procedure declares one. */
export const filterOptionsInput = z.object({});

const defaults: MaterialListInput = materialListInput.parse({});

function parseOr<T>(schema: z.ZodType<T>, raw: unknown, fallback: T): T {
  const result = schema.safeParse(raw);
  return result.success ? result.data : fallback;
}

/** Splits a comma list, keeping only values the element schema accepts (deduplicated). */
function parseList<T>(element: z.ZodType<T>, raw: string | null): T[] | undefined {
  if (raw === null) return undefined;
  const kept: T[] = [];
  for (const part of raw.split(",")) {
    const result = element.safeParse(part.trim());
    if (result.success && !kept.includes(result.data)) kept.push(result.data);
  }
  return kept;
}

function parseNumber(raw: string | null): number | undefined {
  return raw === null ? undefined : Number(raw);
}

/**
 * Reads the table state from the URL. Each param is validated on its own, so
 * one bad value falls back to its default without resetting the others.
 */
export function parseListSearchParams(searchParams: URLSearchParams): MaterialListInput {
  const shape = materialListInput.shape;
  return {
    q: parseOr(shape.q, searchParams.get("q") ?? undefined, defaults.q),
    type: parseOr(shape.type, parseList(typeValue, searchParams.get("type")), defaults.type),
    status: parseOr(
      shape.status,
      parseList(statusValue, searchParams.get("status")),
      defaults.status,
    ),
    plant: parseOr(shape.plant, parseList(plantCode, searchParams.get("plant")), defaults.plant),
    manufacturer: parseOr(
      shape.manufacturer,
      parseList(manufacturerSlug, searchParams.get("manufacturer")),
      defaults.manufacturer,
    ),
    sort: parseOr(shape.sort, searchParams.get("sort") ?? undefined, defaults.sort),
    dir: parseOr(shape.dir, searchParams.get("dir") ?? undefined, defaults.dir),
    page: parseOr(shape.page, parseNumber(searchParams.get("page")), defaults.page),
    pageSize: parseOr(shape.pageSize, parseNumber(searchParams.get("pageSize")), defaults.pageSize),
  };
}

/** Writes the table state to URL params, omitting defaults so the URL stays short. */
export function toListSearchParams(input: MaterialListInput): URLSearchParams {
  const params = new URLSearchParams();
  if (input.q !== defaults.q) params.set("q", input.q);
  if (input.type.length > 0) params.set("type", input.type.join(","));
  if (input.status.length > 0) params.set("status", input.status.join(","));
  if (input.plant.length > 0) params.set("plant", input.plant.join(","));
  if (input.manufacturer.length > 0) params.set("manufacturer", input.manufacturer.join(","));
  if (input.sort !== defaults.sort) params.set("sort", input.sort);
  if (input.dir !== defaults.dir) params.set("dir", input.dir);
  if (input.page !== defaults.page) params.set("page", String(input.page));
  if (input.pageSize !== defaults.pageSize) params.set("pageSize", String(input.pageSize));
  return params;
}
