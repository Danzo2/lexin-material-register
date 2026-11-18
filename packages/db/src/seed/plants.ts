// Australian plants with SAP-style 4-digit codes. The weight is the share of
// materials each plant holds, so Brisbane (the demo plant) is the biggest site.
export const plants = [
  { code: "1000", name: "Brisbane", weight: 30 },
  { code: "1100", name: "Gladstone", weight: 13 },
  { code: "1200", name: "Mackay", weight: 12 },
  { code: "2000", name: "Newcastle", weight: 15 },
  { code: "6000", name: "Perth", weight: 20 },
  { code: "6100", name: "Kalgoorlie", weight: 10 },
] as const;

export type PlantCode = (typeof plants)[number]["code"];

export const demoPlantCode: PlantCode = "1000";
