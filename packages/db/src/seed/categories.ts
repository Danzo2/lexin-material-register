// Category templates. Each one writes descriptions in SAP's noun-first style
// ("Bearing, deep groove ball, 25mm bore") and fixes what a real catalogue would
// keep consistent for that kind of item: material type, unit of measure, which
// manufacturers make it (and their MPN formats), and plausible price (AUD per
// unit) and stock ranges.
import { faker } from "@faker-js/faker";
import type { MaterialType } from "@lexin/shared";
import type { ManufacturerSlug } from "./manufacturers.ts";

export const unitsOfMeasure = ["EA", "KG", "L", "M", "BOX", "SET", "PR"] as const;
export type UnitOfMeasure = (typeof unitsOfMeasure)[number];

// MPN patterns are filled in by faker's replaceSymbols: "#" becomes a digit.
// They sit on the category, not the manufacturer, because one maker numbers a
// bearing differently from a seal (SKF "6205-2RS1" vs "CR 45x62x8 HMS5 RG").
export type Maker = { slug: ManufacturerSlug; mpnPatterns: readonly string[] };

function maker(slug: ManufacturerSlug, ...mpnPatterns: string[]): Maker {
  return { slug, mpnPatterns };
}

export type Category = {
  key: string;
  /** Relative share of all generated materials. */
  weight: number;
  type: MaterialType;
  unitOfMeasure: UnitOfMeasure;
  /** Who makes this kind of item, with each maker's MPN patterns for it. */
  makers: readonly Maker[];
  price: { min: number; max: number };
  stock: { min: number; max: number };
  describe: () => string;
};

// A wrapper rather than a bare method reference: faker's helpers rely on `this`.
function pick<T>(values: readonly T[]): T {
  return faker.helpers.arrayElement(values);
}

const pipeSizes = [15, 20, 25, 40, 50, 80, 100, 150, 200, 250, 300] as const;
const imperialSizes = ['1/4"', '1/2"', '3/4"', '1"', '1-1/2"', '2"', '3"', '4"'] as const;
const motorKw = [
  0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75,
] as const;

const bearingBores = [15, 17, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90, 100] as const;

// ISO bore code, the last two digits of most bearing numbers: 6205 has a 25mm bore.
function boreCode(bore: number): string {
  if (bore === 15) return "02";
  if (bore === 17) return "03";
  return String(bore / 5).padStart(2, "0");
}

// One category per bearing kind and bore, so each MPN series matches the kind
// (deep groove 62xx, spherical 222xx, ...) and "{bore}" in a pattern becomes
// the matching bore code. The kind's weight is shared across its bores.
function bearings(kind: string, weight: number, makers: readonly Maker[]): Category[] {
  return bearingBores.map((bore) => ({
    key: `bearing-${kind.replaceAll(" ", "-")}-${bore}`,
    weight: weight / bearingBores.length,
    type: "spare_part",
    unitOfMeasure: "EA",
    makers: makers.map((m) =>
      maker(m.slug, ...m.mpnPatterns.map((p) => p.replaceAll("{bore}", boreCode(bore)))),
    ),
    price: { min: 12, max: 850 },
    stock: { min: 0, max: 400 },
    describe: () => `Bearing, ${kind}, ${bore}mm bore`,
  }));
}

/** The demo query's categories: SKF makes them, and "bearing" matches their descriptions. */
export const deepGrooveBearings = bearings("deep groove ball", 5, [
  maker("skf", "62{bore}-2RS1", "63{bore}-2Z/C3", "60{bore}-2Z"),
  maker("nsk", "62{bore}DDU", "63{bore}ZZC3"),
  maker("fag", "62{bore}-2RSR", "63{bore}-2Z-C3"),
  maker("ntn", "62{bore}LLU", "63{bore}ZZ/2AS"),
]);

export const categories: readonly Category[] = [
  ...deepGrooveBearings,
  ...bearings("taper roller", 3, [
    maker("timken", "LM1####", "HM2####", "JL6####"),
    maker("skf", "322{bore}/Q", "302{bore}J2/Q"),
    maker("nsk", "HR322{bore}J"),
    maker("ntn", "4T-322{bore}"),
  ]),
  ...bearings("spherical roller", 2, [
    maker("skf", "222{bore} E", "223{bore} E"),
    maker("fag", "222{bore}-E1-XL"),
    maker("nsk", "222{bore}EAE4"),
    maker("timken", "222{bore}EJW33"),
  ]),
  ...bearings("cylindrical roller", 2, [
    maker("skf", "NU2{bore} ECP", "NJ3{bore} ECJ"),
    maker("nsk", "NJ2{bore}EW"),
    maker("fag", "NU2{bore}-E-XL-TVP2"),
    maker("ntn", "NU2{bore}EG1"),
  ]),
  ...bearings("angular contact ball", 2, [
    maker("skf", "72{bore} BECBP", "73{bore} BECBM"),
    maker("fag", "72{bore}-B-XL-TVP"),
    maker("nsk", "72{bore}BW"),
  ]),
  {
    key: "bearing-unit",
    weight: 3,
    type: "spare_part",
    unitOfMeasure: "EA",
    makers: [
      maker("skf", "SY ## TF", "FY ## TF", "TU ## TF"),
      maker("timken", "RAK#-#/#", "YAS#"),
      maker("ntn", "UCP2#0D1", "UCF2#0D1", "UCT2#0D1"),
    ],
    price: { min: 60, max: 450 },
    stock: { min: 0, max: 60 },
    describe: () =>
      `Bearing unit, ${pick(["pillow block", "flanged, 4-bolt", "take-up"])}, ${pick([25, 30, 35, 40, 50, 60])}mm bore`,
  },
  {
    key: "mechanical-seal",
    weight: 4,
    type: "spare_part",
    unitOfMeasure: "EA",
    makers: [
      maker("flowserve", "ISC2-##0PX", "QBQ-##0", "BXA-##0"),
      maker("john-crane", "T2100-##0", "T5610-##0", "T48-##0"),
    ],
    price: { min: 250, max: 4500 },
    stock: { min: 0, max: 20 },
    describe: () =>
      `Seal, mechanical, ${pick(["", "cartridge, ", "split, "])}${pick([25, 30, 35, 45, 55, 65, 75, 90])}mm shaft`,
  },
  {
    key: "oil-seal",
    weight: 5,
    type: "spare_part",
    unitOfMeasure: "EA",
    makers: [
      maker("skf", "CR ##x##x# HMS5 RG", "CR #####"),
      maker("parker-hannifin", "TCM ##x##x#", "OS-####"),
    ],
    price: { min: 4, max: 90 },
    stock: { min: 0, max: 300 },
    describe: () => {
      const shaft = pick([20, 25, 30, 35, 40, 45, 50, 60, 70, 80]);
      const outside = shaft + pick([12, 15, 17, 20, 22]);
      return `Seal, oil, ${shaft}x${outside}x${pick([7, 8, 10, 12])}mm`;
    },
  },
  {
    key: "o-ring",
    weight: 3,
    type: "consumable",
    unitOfMeasure: "EA",
    makers: [maker("parker-hannifin", "2-###-N0674-70", "2-###-V0747-75", "2-###-E0540-70")],
    price: { min: 0.5, max: 12 },
    stock: { min: 0, max: 2000 },
    describe: () =>
      `O-ring, ${pick(["nitrile 70", "viton 75", "EPDM 70"])}, ${faker.number.int({ min: 6, max: 180 })}mm ID x ${pick([1.78, 2.62, 3.53, 5.33, 6.99])}mm`,
  },
  {
    key: "seal-kit",
    weight: 2,
    type: "spare_part",
    unitOfMeasure: "SET",
    makers: [
      maker("parker-hannifin", "RG2HLTS##", "PK##0HLT"),
      maker("bosch-rexroth", "R9009#####", "R96#######"),
    ],
    price: { min: 45, max: 650 },
    stock: { min: 0, max: 30 },
    describe: () => `Seal kit, hydraulic cylinder, ${pick([40, 50, 63, 80, 100, 125, 160])}mm bore`,
  },
  {
    key: "gasket",
    weight: 6,
    type: "consumable",
    unitOfMeasure: "EA",
    makers: [maker("flexitallic", "CGI-#00-150", "SW-#00-300", "RTJ-R##", "SF-####")],
    price: { min: 8, max: 220 },
    stock: { min: 0, max: 200 },
    describe: () =>
      pick([
        () => `Gasket, spiral wound, DN${pick(pipeSizes)} PN${pick([16, 40, 63, 100])}`,
        () => `Gasket, compressed fibre, DN${pick(pipeSizes)} PN16`,
        () => `Gasket, ring type joint, R${faker.number.int({ min: 11, max: 75 })}`,
      ])(),
  },
  {
    key: "hydraulic-filter",
    weight: 6,
    type: "consumable",
    unitOfMeasure: "EA",
    makers: [
      maker("pall", "HC9600FKN##H", "UE319AP##Z", "HC8314FKP##H"),
      maker("donaldson", "P16####", "P17####"),
      maker("parker-hannifin", "93####Q", "G0####"),
    ],
    price: { min: 35, max: 480 },
    stock: { min: 0, max: 120 },
    describe: () => `Filter element, hydraulic, ${pick([3, 5, 10, 25])} micron`,
  },
  {
    key: "engine-filter",
    weight: 5,
    type: "consumable",
    unitOfMeasure: "EA",
    makers: [
      maker("donaldson", "P55####", "P18####", "P77####"),
      maker("caterpillar", "1R-0###", "###-####"),
      maker("atlas-copco", "16##-####-00", "2901-####-00"),
    ],
    price: { min: 25, max: 380 },
    stock: { min: 0, max: 150 },
    describe: () =>
      `Filter element, ${pick(["air, primary", "air, safety", "fuel", "engine oil", "coolant"])}`,
  },
  {
    key: "v-belt",
    weight: 3,
    type: "spare_part",
    unitOfMeasure: "EA",
    // Opaque catalogue numbers: section-coded MPNs (e.g. "B49") would clash with the described section.
    makers: [maker("gates", "9###-####", "VB-#####"), maker("fenner", "FV-######", "0##-####")],
    price: { min: 9, max: 140 },
    stock: { min: 0, max: 150 },
    describe: () =>
      `Belt, V, ${pick(["A", "B", "C", "SPA", "SPB", "SPZ"])}-section ${faker.number.int({ min: 32, max: 160 }) * 25}mm`,
  },
  {
    key: "timing-belt",
    weight: 2,
    type: "spare_part",
    unitOfMeasure: "EA",
    makers: [maker("gates", "PGGT-#####", "TB-#####"), maker("fenner", "FT-######")],
    price: { min: 20, max: 140 },
    stock: { min: 0, max: 80 },
    describe: () =>
      `Belt, timing, ${pick(["5M", "8M", "14M"])} ${faker.number.int({ min: 20, max: 90 }) * 40}mm ${pick([15, 20, 30, 50])}mm wide`,
  },
  {
    key: "motor",
    weight: 3,
    type: "spare_part",
    unitOfMeasure: "EA",
    makers: [
      maker("siemens", "1LE1001-1DB2#-#AA4", "1LE1003-#DB2#-2AA4"),
      maker("abb", "3GBA1#####-ADA", "3GAA1#####-ADE"),
      maker("weg", "W22-#00L", "W22-1#2M", "13######"),
    ],
    price: { min: 450, max: 18000 },
    stock: { min: 0, max: 8 },
    describe: () => `Motor, electric, ${pick(motorKw)}kW ${pick([2, 4, 6])}-pole`,
  },
  {
    key: "contactor",
    weight: 2,
    type: "spare_part",
    unitOfMeasure: "EA",
    makers: [
      maker("schneider-electric", "LC1D##BD", "LC1D##M7"),
      maker("siemens", "3RT20##-1BB40", "3RT20##-1AP00"),
      maker("abb", "AF##-30-10-13", "AF##-30-00-13"),
    ],
    price: { min: 45, max: 650 },
    stock: { min: 0, max: 40 },
    describe: () =>
      `Contactor, 3-pole, ${pick([9, 12, 18, 25, 32, 40, 50, 65, 80])}A ${pick(["24VDC", "240VAC"])} coil`,
  },
  {
    key: "drive",
    weight: 1,
    type: "spare_part",
    unitOfMeasure: "EA",
    makers: [
      maker("schneider-electric", "ATV320U##N4C", "ATV630D##N4"),
      maker("siemens", "6SL3210-1KE2#-#UF1"),
      maker("abb", "ACS580-01-0##A-4"),
      maker("danfoss", "131B####", "132F####"),
    ],
    price: { min: 900, max: 6500 },
    stock: { min: 0, max: 10 },
    describe: () => `Drive, variable speed, ${pick(motorKw)}kW 400V`,
  },
  {
    key: "motor-circuit-breaker",
    weight: 1,
    type: "spare_part",
    unitOfMeasure: "EA",
    makers: [
      maker("schneider-electric", "GV2ME##", "GV3P##"),
      maker("siemens", "3RV20#1-#AA10"),
      maker("abb", "MS132-##", "MS165-##"),
    ],
    price: { min: 80, max: 450 },
    stock: { min: 0, max: 30 },
    describe: () =>
      `Circuit breaker, motor protection, ${pick(["1-1.6", "2.5-4", "6-10", "9-14", "17-23", "24-32"])}A`,
  },
  {
    key: "valve",
    weight: 5,
    type: "spare_part",
    unitOfMeasure: "EA",
    makers: [
      maker("swagelok", "SS-4#GS8", "SS-#00-1-#", "SS-6#TS8", "SS-#RS#", "SS-##F#"),
      maker("flowserve", "WKM-##0", "DUR-####"),
      maker("parker-hannifin", "#Z-B2LJ2-SSP", "HPB#-##"),
    ],
    price: { min: 40, max: 3200 },
    stock: { min: 0, max: 40 },
    describe: () =>
      pick([
        () => `Valve, ball, ${pick(imperialSizes)} ${pick(["316SS", "carbon steel", "brass"])}`,
        () => `Valve, check, ${pick(imperialSizes)} 316SS`,
        () => `Valve, gate, DN${pick(pipeSizes)} PN40`,
        () => `Valve, needle, ${pick(['1/4"', '1/2"'])} 316SS`,
      ])(),
  },
  {
    key: "solenoid-valve",
    weight: 3,
    type: "spare_part",
    unitOfMeasure: "EA",
    makers: [
      maker("festo", "VUVG-L14-M5#-MT-G18-1P3", "MFH-5-1/4-##", "5###"),
      maker("smc", "SY51#0-5LZD-01", "VXZ2#0-03F"),
      maker("danfoss", "032U####", "042N####"),
      maker("parker-hannifin", "PVL-B5#2", "7321BAN##"),
    ],
    price: { min: 60, max: 900 },
    stock: { min: 0, max: 30 },
    describe: () =>
      `Valve, solenoid, ${pick(["5/2-way", "3/2-way", "2/2-way"])}, ${pick(["G1/8", "G1/4", "G1/2"])} ${pick(["24VDC", "240VAC"])}`,
  },
  {
    key: "pneumatic-cylinder",
    weight: 3,
    type: "spare_part",
    unitOfMeasure: "EA",
    makers: [
      maker("festo", "DSBC-63-#00-PPVA-N3", "DSNU-32-#00-PPV-A", "15####"),
      maker("smc", "CP96SDB##-#00", "C96SDB##-#00", "CP96SDB##-#50"),
      maker("parker-hannifin", "P1D-B0##MS-0#00", "P1F-S0##MS-0#00"),
      maker("bosch-rexroth", "R4800#####", "R4801#####"),
    ],
    price: { min: 90, max: 1600 },
    stock: { min: 0, max: 25 },
    describe: () =>
      `Cylinder, pneumatic, ${pick([32, 40, 50, 63, 80, 100, 125])}mm bore ${pick([25, 50, 100, 160, 200, 250, 320, 500])}mm stroke`,
  },
  {
    key: "hydraulic-pump",
    weight: 2,
    type: "spare_part",
    unitOfMeasure: "EA",
    makers: [
      maker("bosch-rexroth", "A10VSO##DR/31R-PPA12N00", "AZPF-1#-0##RCB20MB"),
      maker("parker-hannifin", "PV0##R1K1T1NMMC", "PGP5#5B0##"),
      maker("danfoss", "151F####", "83#####"),
    ],
    price: { min: 900, max: 14000 },
    stock: { min: 0, max: 6 },
    describe: () =>
      `Pump, hydraulic, ${pick(["gear", "axial piston", "vane"])}, ${pick([8, 11, 16, 23, 28, 45, 71, 100])}cc`,
  },
  {
    key: "hydraulic-hose",
    weight: 3,
    type: "consumable",
    unitOfMeasure: "M",
    makers: [
      maker("parker-hannifin", "301-##", "471TC-##", "421-##"),
      maker("gates", "#G2", "#M2T", "#M4K"),
    ],
    price: { min: 12, max: 75 },
    stock: { min: 0, max: 500 },
    describe: () =>
      `Hose, hydraulic, ${pick(['1/4"', '3/8"', '1/2"', '3/4"', '1"'])} ${pick(["1-wire", "2-wire", "4-spiral"])}`,
  },
  {
    key: "grease-cartridge",
    weight: 4,
    type: "consumable",
    unitOfMeasure: "EA",
    makers: [
      maker("mobil", "15####", "MOBILUX-EP#"),
      maker("castrol", "34####", "15A###"),
      maker("skf", "LGEP 2/#", "LGWA 2/#", "LGHP 2/#"),
    ],
    price: { min: 9, max: 45 },
    stock: { min: 0, max: 600 },
    describe: () =>
      `Grease, ${pick(["lithium complex", "calcium sulphonate", "polyurea", "lithium EP2"])}, ${pick(["400g", "450g"])}`,
  },
  {
    key: "grease-bulk",
    weight: 1,
    type: "consumable",
    unitOfMeasure: "KG",
    makers: [maker("mobil", "12####", "MOB-#####"), maker("castrol", "34####", "CAS-#####")],
    price: { min: 8, max: 25 },
    stock: { min: 0, max: 1800 },
    describe: () =>
      `Grease, ${pick(["lithium complex", "calcium sulphonate", "molybdenum EP"])}, bulk`,
  },
  {
    key: "oil",
    weight: 3,
    type: "consumable",
    unitOfMeasure: "L",
    makers: [maker("mobil", "12####", "MOB-#####"), maker("castrol", "34####", "CAS-#####")],
    price: { min: 4, max: 18 },
    stock: { min: 0, max: 4000 },
    describe: () =>
      pick([
        () => `Oil, hydraulic, ISO VG ${pick([32, 46, 68])}`,
        () => `Oil, gear, ISO VG ${pick([150, 220, 320, 460])}`,
        () => `Oil, engine, SAE ${pick(["15W-40", "10W-30", "5W-40"])}`,
      ])(),
  },
  {
    key: "adhesive",
    weight: 4,
    type: "consumable",
    unitOfMeasure: "EA",
    makers: [
      maker("loctite", "IDH1######", "2#3-50ML", "5#8-250ML"),
      maker("3m", "70-00##-####-#", "UU00####"),
    ],
    price: { min: 8, max: 95 },
    stock: { min: 0, max: 250 },
    describe: () =>
      pick([
        `Threadlocker, medium strength, 50ml`,
        `Threadlocker, high strength, 50ml`,
        `Retaining compound, high strength, 50ml`,
        `Sealant, silicone, 300ml`,
        `Tape, PTFE thread seal, 12mm x 10m`,
        `Adhesive, epoxy, 2-part, 50ml`,
      ]),
  },
  {
    key: "gloves",
    weight: 3,
    type: "consumable",
    unitOfMeasure: "PR",
    makers: [maker("3m", "CG-#00-L", "XA00######")],
    price: { min: 4, max: 28 },
    stock: { min: 0, max: 800 },
    describe: () =>
      `Gloves, ${pick(["cut resistant", "nitrile coated", "rigger", "chemical resistant"])}, size ${pick([8, 9, 10, 11])}`,
  },
  {
    key: "ppe-boxed",
    weight: 2,
    type: "consumable",
    unitOfMeasure: "BOX",
    makers: [maker("3m", "70-0716-####-#", "UU00####", "8###")],
    price: { min: 30, max: 120 },
    stock: { min: 0, max: 80 },
    describe: () =>
      pick([
        `Earplugs, foam, uncorded, box of 200`,
        `Respirator, disposable, P2, box of 20`,
        `Wipes, industrial cleaning, box of 100`,
      ]),
  },
  {
    key: "anchor",
    weight: 3,
    type: "consumable",
    unitOfMeasure: "BOX",
    makers: [maker("hilti", "20#####", "21#####", "4#####")],
    price: { min: 25, max: 260 },
    stock: { min: 0, max: 90 },
    describe: () =>
      `Anchor, ${pick(["wedge", "sleeve", "screw"])}, M${pick([8, 10, 12, 16, 20])} x ${pick([75, 100, 120, 150])}mm, box of ${pick([25, 50])}`,
  },
  {
    key: "steel-plate",
    weight: 3,
    type: "raw_material",
    unitOfMeasure: "KG",
    makers: [maker("bluescope", "PL350-##-####", "PL250-##-####")],
    price: { min: 1.8, max: 4.5 },
    stock: { min: 0, max: 25000 },
    describe: () => `Plate, steel, ${pick([6, 8, 10, 12, 16, 20, 25])}mm grade ${pick([250, 350])}`,
  },
  {
    key: "steel-pipe",
    weight: 2,
    type: "raw_material",
    unitOfMeasure: "M",
    makers: [maker("bluescope", "OR-####-##", "OR-CHS-####")],
    price: { min: 15, max: 180 },
    stock: { min: 0, max: 600 },
    describe: () => `Pipe, carbon steel, DN${pick(pipeSizes)} Sch${pick([40, 80])}`,
  },
  {
    key: "stainless-stock",
    weight: 2,
    type: "raw_material",
    unitOfMeasure: "M",
    makers: [maker("sandvik", "SAF-####-##", "3R60-##-####")],
    price: { min: 18, max: 260 },
    stock: { min: 0, max: 600 },
    describe: () =>
      pick([
        () => `Tube, stainless, ${pick([6, 10, 12, 16, 25])}mm OD x ${pick([1, 1.5, 2])}mm 316L`,
        () => `Bar, round, ${pick([20, 25, 32, 40, 50, 65])}mm 316`,
      ])(),
  },
  {
    key: "turning-insert",
    weight: 1,
    type: "tool",
    unitOfMeasure: "BOX",
    makers: [maker("sandvik", "CNMG 12 04 0#-PM", "DNMG 15 06 0#-PM", "WNMG 08 04 0#-PM")],
    price: { min: 90, max: 420 },
    stock: { min: 0, max: 60 },
    describe: () =>
      `Insert, carbide turning, grade ${pick(["4315", "4325", "4335", "1125"])}, box of 10`,
  },
  {
    key: "milling-insert",
    weight: 1,
    type: "tool",
    unitOfMeasure: "BOX",
    makers: [maker("sandvik", "R390-11 T3 0#M-PM", "R390-17 04 0#M-PM", "R245-12 T3 #M-PM")],
    price: { min: 90, max: 420 },
    stock: { min: 0, max: 60 },
    describe: () => `Insert, carbide milling, grade ${pick(["1130", "4340", "1040"])}, box of 10`,
  },
  {
    key: "hand-tool",
    weight: 2,
    type: "tool",
    unitOfMeasure: "EA",
    makers: [maker("stanley", "STMT#####", "1-##-###", "STHT#####")],
    price: { min: 15, max: 120 },
    stock: { min: 0, max: 40 },
    describe: () =>
      pick([
        `Spanner, adjustable, ${pick([200, 250, 300, 375])}mm`,
        `Hammer, ball pein, ${pick([450, 680, 900])}g`,
        `Pliers, combination, 200mm`,
        `Knife, utility, retractable`,
      ]),
  },
  {
    key: "power-tool",
    weight: 2,
    type: "tool",
    unitOfMeasure: "EA",
    makers: [
      maker("atlas-copco", "8423-####-##", "8431-####-##"),
      maker("hilti", "20#####", "22#####"),
    ],
    price: { min: 350, max: 2800 },
    stock: { min: 0, max: 10 },
    describe: () =>
      pick([
        `Wrench, impact, pneumatic, ${pick(['1/2"', '3/4"', '1"'])} drive`,
        `Drill, rotary hammer, SDS-max`,
        `Grinder, angle, ${pick([125, 180, 230])}mm`,
      ]),
  },
  {
    key: "tool-set",
    weight: 1,
    type: "tool",
    unitOfMeasure: "SET",
    makers: [maker("stanley", "STMT#####", "1-##-###")],
    price: { min: 90, max: 650 },
    stock: { min: 0, max: 15 },
    describe: () =>
      `Socket set, ${pick(['1/4"', '3/8"', '1/2"'])} drive, ${pick([24, 40, 72, 96])}-piece`,
  },
];
