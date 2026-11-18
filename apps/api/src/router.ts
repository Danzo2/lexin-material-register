import { sql } from "drizzle-orm";
import { healthInput, healthOutput } from "@lexin/shared";
import { materialsRouter } from "./materials/router.ts";
import { publicProcedure, router } from "./trpc.ts";

export const appRouter = router({
  health: publicProcedure
    .input(healthInput)
    .output(healthOutput)
    .query(async ({ ctx }) => {
      try {
        await ctx.db.execute(sql`select 1`);
        return { ok: true as const, db: "up" as const };
      } catch {
        return { ok: true as const, db: "down" as const };
      }
    }),
  materials: materialsRouter,
});

/** The only thing apps/web imports from the API, and only as a type. */
export type AppRouter = typeof appRouter;
