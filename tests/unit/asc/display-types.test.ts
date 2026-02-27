import { describe, it, expect } from "vitest";
import {
  displayTypeLabel,
  sortDisplayTypes,
  screenshotImageUrl,
  DISPLAY_TYPE_LABELS,
  DISPLAY_TYPE_ORDER,
} from "@/lib/asc/display-types";

describe("display-types", () => {
  describe("DISPLAY_TYPE_LABELS", () => {
    it("is a non-empty record", () => {
      expect(Object.keys(DISPLAY_TYPE_LABELS).length).toBeGreaterThan(0);
    });

    it("maps known types to labels", () => {
      expect(DISPLAY_TYPE_LABELS.APP_IPHONE_67).toBe('iPhone 6.7"');
      expect(DISPLAY_TYPE_LABELS.APP_DESKTOP).toBe("Mac");
    });
  });

  describe("displayTypeLabel", () => {
    it("returns the label for a known display type", () => {
      expect(displayTypeLabel("APP_IPHONE_67")).toBe('iPhone 6.7"');
      expect(displayTypeLabel("APP_APPLE_TV")).toBe("Apple TV");
    });

    it("returns the type string itself for an unknown type", () => {
      expect(displayTypeLabel("UNKNOWN_TYPE")).toBe("UNKNOWN_TYPE");
    });
  });

  describe("sortDisplayTypes", () => {
    it("sorts types according to DISPLAY_TYPE_ORDER", () => {
      const input = ["APP_DESKTOP", "APP_IPHONE_67", "APP_IPAD_97"];
      const sorted = sortDisplayTypes(input);
      expect(sorted).toEqual(["APP_IPHONE_67", "APP_IPAD_97", "APP_DESKTOP"]);
    });

    it("places unknown types at the end, sorted alphabetically", () => {
      const input = ["UNKNOWN_B", "APP_IPHONE_67", "UNKNOWN_A"];
      const sorted = sortDisplayTypes(input);
      expect(sorted).toEqual(["APP_IPHONE_67", "UNKNOWN_A", "UNKNOWN_B"]);
    });

    it("does not mutate the original array", () => {
      const input = ["APP_DESKTOP", "APP_IPHONE_67"];
      sortDisplayTypes(input);
      expect(input).toEqual(["APP_DESKTOP", "APP_IPHONE_67"]);
    });

    it("returns empty array for empty input", () => {
      expect(sortDisplayTypes([])).toEqual([]);
    });

    it("matches all items in DISPLAY_TYPE_ORDER", () => {
      const sorted = sortDisplayTypes([...DISPLAY_TYPE_ORDER].reverse());
      expect(sorted).toEqual(DISPLAY_TYPE_ORDER);
    });
  });

  describe("screenshotImageUrl", () => {
    it("builds a CDN URL with default width", () => {
      expect(screenshotImageUrl("Purple/v4/abc")).toBe(
        "https://is1-ssl.mzstatic.com/image/thumb/Purple/v4/abc/300x0w.png",
      );
    });

    it("builds a CDN URL with custom width", () => {
      expect(screenshotImageUrl("Purple/v4/abc", 600)).toBe(
        "https://is1-ssl.mzstatic.com/image/thumb/Purple/v4/abc/600x0w.png",
      );
    });
  });
});
