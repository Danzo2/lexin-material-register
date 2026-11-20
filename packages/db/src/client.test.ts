import { afterEach, describe, expect, it, vi } from "vitest";
import { createDb } from "./client.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createDb", () => {
  // Without a listener, emitting 'error' throws: that is the API crash.
  it("survives an error from an idle pooled client", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // No query runs, so the pool never connects to this address.
    const { pool } = createDb("postgres://user:secret@localhost:1/nowhere");

    expect(() =>
      pool.emit("error", new Error("terminating connection due to administrator command")),
    ).not.toThrow();

    // Exactly the error message: nothing from the pool's config, such as the
    // connection string and its password, ends up in the log.
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      "Postgres pool: idle client error: terminating connection due to administrator command",
    );

    await pool.end();
  });
});
