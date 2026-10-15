import { describe, it, expect } from "vitest";
import { iconVersion, pwaIconPath } from "@/lib/pwa";

describe("pwaIconPath", () => {
  it("builds a versioned icon path", () => {
    expect(pwaIconPath(192, "/icon.svg")).toBe(`/pwa-icon/192?v=${iconVersion("/icon.svg")}`);
  });

  it("marks maskable icons", () => {
    expect(pwaIconPath(512, "/icon.svg", true)).toContain("maskable=1");
  });

  it("changes version when the icon changes", () => {
    expect(iconVersion("/icon.svg")).not.toBe(iconVersion("https://cdn.example.com/logo.png"));
  });
});
