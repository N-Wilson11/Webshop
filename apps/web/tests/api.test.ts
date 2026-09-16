import { describe, it, expect } from "vitest";
import { formatPrice } from "@/lib/api";

describe("formatPrice", () => {
  it("formats EUR currency correctly", () => {
    expect(formatPrice(3.5, "EUR")).toBe("€3.50");
  });

  it("formats USD currency correctly", () => {
    expect(formatPrice(10, "USD")).toBe("$10.00");
  });
});
