import { describe, expect, it } from "vitest";
import { formatDate, formatPrice, formatStock } from "./format.ts";

describe("format", () => {
  it("formats prices as AUD", () => {
    expect(formatPrice("1290.5")).toBe("$1,290.50");
  });

  it("groups stock thousands", () => {
    expect(formatStock(12500)).toBe("12,500");
  });

  it("formats a short date", () => {
    expect(formatDate("2026-11-19T09:00:00.000Z")).toBe("19 Nov 2026");
  });
});
