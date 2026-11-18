import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { createDb, databaseUrl } from "@lexin/db";
import { appRouter } from "./router.ts";

const { db } = createDb(databaseUrl());
const port = Number(process.env.API_PORT ?? 3001);

// The web dev server proxies /trpc here, so the browser never makes a
// cross-origin request and no CORS setup is needed.
const server = createHTTPServer({
  basePath: "/trpc/",
  router: appRouter,
  createContext: () => ({ db }),
  // Clients only get a sanitised message (see trpc.ts), so the server log is
  // where the detail lives: full error and stack for unexpected failures, the
  // original message for expected ones such as a rejected input.
  onError: ({ path, error }) => {
    const where = `tRPC ${path ?? "?"}`;
    if (error.code === "INTERNAL_SERVER_ERROR") console.error(`${where}:`, error);
    else console.warn(`${where}: ${error.code} ${error.message}`);
  },
});

server.listen(port);
console.log(`API listening on http://localhost:${port}/trpc`);
