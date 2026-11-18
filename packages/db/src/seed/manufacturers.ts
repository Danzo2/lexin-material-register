// Real industrial manufacturers. Their MPN formats live with the category
// templates (./categories.ts), since they depend on the kind of item.
export const manufacturers = [
  { slug: "skf", name: "SKF" },
  { slug: "timken", name: "Timken" },
  { slug: "nsk", name: "NSK" },
  { slug: "fag", name: "FAG" },
  { slug: "ntn", name: "NTN" },
  { slug: "parker-hannifin", name: "Parker Hannifin" },
  { slug: "festo", name: "Festo" },
  { slug: "smc", name: "SMC" },
  { slug: "gates", name: "Gates" },
  { slug: "fenner", name: "Fenner" },
  { slug: "siemens", name: "Siemens" },
  { slug: "abb", name: "ABB" },
  { slug: "weg", name: "WEG" },
  { slug: "schneider-electric", name: "Schneider Electric" },
  { slug: "danfoss", name: "Danfoss" },
  { slug: "flowserve", name: "Flowserve" },
  { slug: "john-crane", name: "John Crane" },
  { slug: "swagelok", name: "Swagelok" },
  { slug: "flexitallic", name: "Flexitallic" },
  { slug: "3m", name: "3M" },
  { slug: "loctite", name: "Loctite" },
  { slug: "bosch-rexroth", name: "Bosch Rexroth" },
  { slug: "atlas-copco", name: "Atlas Copco" },
  { slug: "sandvik", name: "Sandvik" },
  { slug: "caterpillar", name: "Caterpillar" },
  { slug: "mobil", name: "Mobil" },
  { slug: "castrol", name: "Castrol" },
  { slug: "pall", name: "Pall" },
  { slug: "donaldson", name: "Donaldson" },
  { slug: "bluescope", name: "BlueScope" },
  { slug: "hilti", name: "Hilti" },
  { slug: "stanley", name: "Stanley" },
] as const;

export type ManufacturerSlug = (typeof manufacturers)[number]["slug"];

export const demoManufacturerSlug: ManufacturerSlug = "skf";
