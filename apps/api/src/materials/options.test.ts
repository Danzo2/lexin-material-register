import { describe, expect, it } from "vitest";
import { connectTestDb } from "../test/db.ts";
import { filterOptions } from "./options.ts";

const db = connectTestDb();

describe("filterOptions", () => {
  it("lists plants by code and manufacturers by name", async () => {
    expect(await filterOptions(db)).toEqual({
      plants: [
        { code: "1000", name: "Brisbane" },
        { code: "2000", name: "Sydney" },
        { code: "3000", name: "Perth" },
      ],
      manufacturers: [
        { slug: "3m", name: "3M" },
        { slug: "fluke", name: "Fluke" },
        { slug: "parker-hannifin", name: "Parker Hannifin" },
        { slug: "skf", name: "SKF" },
      ],
    });
  });
});
