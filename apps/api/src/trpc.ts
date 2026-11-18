import { initTRPC } from "@trpc/server";
import type { Db } from "@lexin/db";

export interface Context {
  db: Db;
}

const t = initTRPC.context<Context>().create({
  // Never send stack traces to the browser, even in development.
  isDev: false,
  errorFormatter({ shape, error }) {
    // Unexpected errors can carry SQL (Drizzle puts the failed query in the
    // message). The server logs the detail; clients get a generic message.
    if (error.code === "INTERNAL_SERVER_ERROR")
      return { ...shape, message: "Internal server error" };
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
