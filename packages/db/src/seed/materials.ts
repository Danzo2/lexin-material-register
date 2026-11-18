// Builds material rows from the category templates. Deterministic for a fixed
// faker seed, so every machine gets the same rows.
import { faker } from "@faker-js/faker";
import type { MaterialStatus, MaterialType } from "@lexin/shared";
import { categories, deepGrooveBearings } from "./categories.ts";
import type { Category, Maker, UnitOfMeasure } from "./categories.ts";
import { demoManufacturerSlug } from "./manufacturers.ts";
import type { ManufacturerSlug } from "./manufacturers.ts";
import { demoPlantCode, plants } from "./plants.ts";
import type { PlantCode } from "./plants.ts";

/** Every Nth row is forced to be an active SKF bearing at Brisbane, so the brief's demo query always has results. */
export const demoRowInterval = 100;

// Fixed window rather than "now", so the data doesn't change with the day you seed.
const updatedFrom = new Date("2024-11-19T00:00:00Z");
const updatedTo = new Date("2026-11-19T00:00:00Z");

const statusWeights = [
  { weight: 80, value: "active" },
  { weight: 12, value: "obsolete" },
  { weight: 8, value: "pending_review" },
] as const satisfies readonly { weight: number; value: MaterialStatus }[];

const categoryWeights = categories.map((category) => ({
  weight: category.weight,
  value: category,
}));
const plantWeights = plants.map((plant) => ({ weight: plant.weight, value: plant.code }));

function demoMakerOf(category: Category): Maker {
  const found = category.makers.find((m) => m.slug === demoManufacturerSlug);
  if (found === undefined) throw new Error(`${category.key} must include the demo manufacturer`);
  return found;
}

export type SeedMaterial = {
  materialNumber: string;
  description: string;
  type: MaterialType;
  manufacturerSlug: ManufacturerSlug;
  mpn: string;
  plantCode: PlantCode;
  status: MaterialStatus;
  unitOfMeasure: UnitOfMeasure;
  unitPrice: string;
  stockOnHand: number;
  updatedAt: Date;
};

export function formatMaterialNumber(index: number): string {
  return `MAT-${String(index + 1).padStart(6, "0")}`;
}

// How many fresh MPNs to try before adding a numeric suffix to make one unique.
const mpnAttempts = 20;

/**
 * Returns a builder for the material at a zero-based index (index 0 is MAT-000001).
 * The builder remembers each product's MPN, so the same maker + description always
 * gets the same MPN (the same part stocked at several plants), and one MPN never
 * names two different products. Create one builder per seed run.
 */
export function createMaterialBuilder(): (index: number) => SeedMaterial {
  const mpnByProduct = new Map<string, string>();
  const usedMpns = new Set<string>();

  function mpnFor(maker: Maker, description: string): string {
    const productKey = `${maker.slug}|${description}`;
    const known = mpnByProduct.get(productKey);
    if (known !== undefined) return known;

    const fill = () => faker.helpers.replaceSymbols(faker.helpers.arrayElement(maker.mpnPatterns));
    let mpn = fill();
    for (let attempt = 1; usedMpns.has(`${maker.slug}|${mpn}`); attempt++) {
      mpn = attempt < mpnAttempts ? fill() : `${fill()}-${attempt}`;
    }
    usedMpns.add(`${maker.slug}|${mpn}`);
    mpnByProduct.set(productKey, mpn);
    return mpn;
  }

  return (index) => {
    const isDemoRow = index % demoRowInterval === 0;
    const category = isDemoRow
      ? faker.helpers.arrayElement(deepGrooveBearings)
      : faker.helpers.weightedArrayElement(categoryWeights);
    const maker = isDemoRow ? demoMakerOf(category) : faker.helpers.arrayElement(category.makers);
    const description = category.describe();

    return {
      materialNumber: formatMaterialNumber(index),
      description,
      type: category.type,
      manufacturerSlug: maker.slug,
      mpn: mpnFor(maker, description),
      plantCode: isDemoRow ? demoPlantCode : faker.helpers.weightedArrayElement(plantWeights),
      status: isDemoRow ? "active" : faker.helpers.weightedArrayElement(statusWeights),
      unitOfMeasure: category.unitOfMeasure,
      unitPrice: faker.number
        .float({ min: category.price.min, max: category.price.max, fractionDigits: 2 })
        .toFixed(2),
      stockOnHand: faker.number.int(category.stock),
      updatedAt: faker.date.between({ from: updatedFrom, to: updatedTo }),
    };
  };
}
