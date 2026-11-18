import { initTRPC } from "@trpc/server";
import { z } from "zod";
import type { Db } from "@lexin/db";

export interface Context {
  db: Db;
}

// Turns zod issues into one readable line, e.g.
// "Invalid input: pageSize: Invalid option: expected one of 25|50|100".
function describeZodError(error: z.ZodError): string {
  const issues = error.issues.map((issue) =>
    issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
  );
  return `Invalid input: ${issues.join("; ")}`;
}

const t = initTRPC.context<Context>().create({
  // Never send stack traces to the browser, even in development.
  isDev: false,
  errorFormatter({ shape, error }) {
    // Unexpected errors can carry SQL (Drizzle puts the failed query in the
    // message). The server logs the detail; clients get a generic message.
    if (error.code === "INTERNAL_SERVER_ERROR")
      return { ...shape, message: "Internal server error" };
    // tRPC already maps a failed .input() parse to BAD_REQUEST, but its default
    // message is the raw JSON issue list. Send one readable line instead.
    if (error.code === "BAD_REQUEST" && error.cause instanceof z.ZodError)
      return { ...shape, message: describeZodError(error.cause) };
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
