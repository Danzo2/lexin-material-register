import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const repoRoot = new URL("../..", import.meta.url).pathname;
const srcDir = new URL("./src", import.meta.url).pathname;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, "");
  const apiPort = env.API_PORT ?? "3001";
  // WEB_PORT lets parallel worktrees run their own dev servers side by side.
  const webPort = Number(env.WEB_PORT ?? 5173);

  return {
    plugins: [react(), tailwindcss()],
    envDir: repoRoot,
    resolve: { alias: { "@": srcDir } },
    server: {
      port: webPort,
      strictPort: true,
      proxy: { "/trpc": `http://localhost:${apiPort}` },
    },
  };
});
