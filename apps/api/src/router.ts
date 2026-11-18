import { sql } from "drizzle-orm";
import { healthOutput } from "@lexin/shared";
import { publicProcedure, router } from "./trpc.ts";

export const appRouter = router({
  health: publicProcedure.output(healthOutput).query(async ({ ctx }) => {
    try {
      await ctx.db.execute(sql`select 1`);
      return { ok: true as const, db: "up" as const };
    } catch {
      return { ok: true as const, db: "down" as const };
    }
  }),
});

/** The only thing apps/web imports from the API, and only as a type. */
export type AppRouter = typeof appRouter;
