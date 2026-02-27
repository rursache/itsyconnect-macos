import { describe, it, expect } from "vitest";
import {
  MOCK_APPS,
  MOCK_VERSIONS,
  MOCK_BUILDS,
  MOCK_LOCALIZATIONS,
  getAppVersions,
  getVersion,
  getVersionLocalizations,
  getVersionBuild,
  getAppPlatforms,
  getVersionsByPlatform,
  getDefaultVersion,
  resolveVersion,
} from "@/lib/mock-data";

describe("mock-data", () => {
  describe("data shapes", () => {
    it("MOCK_APPS has entries with required fields", () => {
      expect(MOCK_APPS.length).toBeGreaterThan(0);
      for (const app of MOCK_APPS) {
        expect(app).toHaveProperty("id");
        expect(app).toHaveProperty("name");
        expect(app).toHaveProperty("bundleId");
        expect(app).toHaveProperty("sku");
        expect(app).toHaveProperty("primaryLocale");
      }
    });

    it("MOCK_VERSIONS has entries with required fields", () => {
      expect(MOCK_VERSIONS.length).toBeGreaterThan(0);
      for (const v of MOCK_VERSIONS) {
        expect(v).toHaveProperty("id");
        expect(v).toHaveProperty("appId");
        expect(v).toHaveProperty("versionString");
        expect(v).toHaveProperty("platform");
        expect(v).toHaveProperty("appVersionState");
        expect(v).toHaveProperty("createdDate");
        expect(["IOS", "MAC_OS", "TV_OS", "VISION_OS"]).toContain(v.platform);
      }
    });

    it("MOCK_BUILDS has entries with required fields", () => {
      expect(MOCK_BUILDS.length).toBeGreaterThan(0);
      for (const b of MOCK_BUILDS) {
        expect(b).toHaveProperty("id");
        expect(b).toHaveProperty("versionId");
        expect(b).toHaveProperty("buildNumber");
        expect(b).toHaveProperty("uploadedDate");
        expect(b).toHaveProperty("versionString");
      }
    });

    it("MOCK_LOCALIZATIONS has entries with required fields", () => {
      expect(MOCK_LOCALIZATIONS.length).toBeGreaterThan(0);
      for (const l of MOCK_LOCALIZATIONS) {
        expect(l).toHaveProperty("id");
        expect(l).toHaveProperty("versionId");
        expect(l).toHaveProperty("locale");
        expect(l).toHaveProperty("name");
      }
    });

    it("every version references a valid app", () => {
      const appIds = new Set(MOCK_APPS.map((a) => a.id));
      for (const v of MOCK_VERSIONS) {
        expect(appIds).toContain(v.appId);
      }
    });

    it("every build references a valid version", () => {
      const versionIds = new Set(MOCK_VERSIONS.map((v) => v.id));
      for (const b of MOCK_BUILDS) {
        expect(versionIds).toContain(b.versionId);
      }
    });

    it("every localization references a valid version", () => {
      const versionIds = new Set(MOCK_VERSIONS.map((v) => v.id));
      for (const l of MOCK_LOCALIZATIONS) {
        expect(versionIds).toContain(l.versionId);
      }
    });
  });

  describe("getAppVersions", () => {
    it("returns versions for app-001", () => {
      const versions = getAppVersions("app-001");
      expect(versions.length).toBeGreaterThan(0);
      for (const v of versions) {
        expect(v.appId).toBe("app-001");
      }
    });

    it("returns empty array for unknown app", () => {
      expect(getAppVersions("nonexistent")).toEqual([]);
    });
  });

  describe("getVersion", () => {
    it("returns version by ID", () => {
      const version = getVersion("ver-001");
      expect(version).toBeDefined();
      expect(version!.id).toBe("ver-001");
    });

    it("returns undefined for unknown ID", () => {
      expect(getVersion("nonexistent")).toBeUndefined();
    });
  });

  describe("getVersionLocalizations", () => {
    it("returns localizations for ver-001", () => {
      const locs = getVersionLocalizations("ver-001");
      expect(locs.length).toBeGreaterThan(0);
      for (const l of locs) {
        expect(l.versionId).toBe("ver-001");
      }
    });

    it("returns empty array for unknown version", () => {
      expect(getVersionLocalizations("nonexistent")).toEqual([]);
    });
  });

  describe("getVersionBuild", () => {
    it("returns build for ver-001", () => {
      const build = getVersionBuild("ver-001");
      expect(build).toBeDefined();
      expect(build!.versionId).toBe("ver-001");
    });

    it("returns undefined for unknown version", () => {
      expect(getVersionBuild("nonexistent")).toBeUndefined();
    });
  });

  describe("getAppPlatforms", () => {
    it("returns platforms for app-002 (iOS, macOS, tvOS)", () => {
      const platforms = getAppPlatforms("app-002");
      expect(platforms).toContain("IOS");
      expect(platforms).toContain("MAC_OS");
      expect(platforms).toContain("TV_OS");
    });

    it("returns empty array for unknown app", () => {
      expect(getAppPlatforms("nonexistent")).toEqual([]);
    });
  });

  describe("getVersionsByPlatform", () => {
    it("returns iOS versions for app-001", () => {
      const versions = getVersionsByPlatform("app-001", "IOS");
      expect(versions.length).toBeGreaterThan(0);
      for (const v of versions) {
        expect(v.appId).toBe("app-001");
        expect(v.platform).toBe("IOS");
      }
    });

    it("returns empty array for unknown app/platform combo", () => {
      expect(getVersionsByPlatform("app-001", "TV_OS")).toEqual([]);
    });
  });

  describe("getDefaultVersion", () => {
    it("prefers PREPARE_FOR_SUBMISSION state", () => {
      const version = getDefaultVersion("app-001");
      expect(version).toBeDefined();
      expect(version!.appVersionState).toBe("PREPARE_FOR_SUBMISSION");
    });

    it("falls back to first version when no editable version exists", () => {
      // app-002 has no PREPARE_FOR_SUBMISSION – first version is ver-004 (IN_REVIEW)
      const version = getDefaultVersion("app-002");
      expect(version).toBeDefined();
      expect(version!.id).toBe("ver-004");
    });

    it("returns undefined for unknown app", () => {
      expect(getDefaultVersion("nonexistent")).toBeUndefined();
    });
  });

  describe("resolveVersion", () => {
    it("returns specific version when valid ID is given", () => {
      const version = resolveVersion("app-001", "ver-002");
      expect(version).toBeDefined();
      expect(version!.id).toBe("ver-002");
    });

    it("falls back to default when version ID does not belong to app", () => {
      const version = resolveVersion("app-001", "ver-004");
      expect(version).toBeDefined();
      expect(version!.appId).toBe("app-001");
    });

    it("falls back to default when version ID is null", () => {
      const version = resolveVersion("app-001", null);
      expect(version).toBeDefined();
      expect(version!.appId).toBe("app-001");
    });

    it("returns undefined for unknown app", () => {
      expect(resolveVersion("nonexistent", null)).toBeUndefined();
    });
  });
});
