import { afterEach, describe, expect, it, vi } from "vitest";
import { createDb } from "./client.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createDb", () => {
  // pg-pool re-emits errors from idle clients (e.g. Postgres restarting) on the
  // pool. Without a listener Node throws "Unhandled 'error' event" and the API
  // process exits.
  it("survives an error from an idle pooled client", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // No query runs, so the pool never connects to this address.
    const { pool } = createDb("postgres://user:secret@localhost:1/nowhere");

    expect(() =>
      pool.emit("error", new Error("terminating connection due to administrator command")),
    ).not.toThrow();

    expect(warn).toHaveBeenCalledOnce();
    const message = String(warn.mock.calls[0]?.join(" "));
    expect(message).toContain("terminating connection due to administrator command");
    expect(message).not.toContain("secret");

    await pool.end();
  });
});
