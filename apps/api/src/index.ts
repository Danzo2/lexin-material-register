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
  onError: ({ path, error }) => {
    if (error.code === "INTERNAL_SERVER_ERROR") console.error(`tRPC ${path ?? "?"}:`, error);
  },
});

server.listen(port);
console.log(`API listening on http://localhost:${port}/trpc`);
