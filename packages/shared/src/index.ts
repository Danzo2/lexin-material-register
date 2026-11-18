// The contract between apps/web and apps/api: enum value lists, zod input
// schemas and the types inferred from them. Runtime-safe in the browser, so
// nothing here may import from @lexin/db, node built-ins or server code.
// Feature tickets add the materials list input schema here.

import { z } from "zod";

export const healthOutput = z.object({
  ok: z.literal(true),
  db: z.enum(["up", "down"]),
});
export type HealthOutput = z.infer<typeof healthOutput>;
