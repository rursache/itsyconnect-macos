import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ensureLocalModelLoaded,
  normalizeOpenAICompatibleBaseUrl,
  resetLocalModelLoadStateForTests,
  resolveLocalOpenAIBaseUrl,
} from "@/lib/ai/local-provider";

describe("normalizeOpenAICompatibleBaseUrl", () => {
  it("adds /v1 when missing", () => {
    expect(normalizeOpenAICompatibleBaseUrl("http://127.0.0.1:1234")).toBe(
      "http://127.0.0.1:1234/v1",
    );
  });

  it("normalizes chat completions URLs to /v1", () => {
    expect(
      normalizeOpenAICompatibleBaseUrl("http://127.0.0.1:1234/v1/chat/completions"),
    ).toBe("http://127.0.0.1:1234/v1");
  });

  it("returns null for invalid urls", () => {
    expect(normalizeOpenAICompatibleBaseUrl("not a url")).toBeNull();
  });
});

describe("resolveLocalOpenAIBaseUrl", () => {
  it("falls back to default when invalid", () => {
    expect(resolveLocalOpenAIBaseUrl("bad url")).toBe("http://127.0.0.1:1234/v1");
  });
});

describe("ensureLocalModelLoaded", () => {
  afterEach(() => {
    resetLocalModelLoadStateForTests();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns null when model load succeeds", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));

    const result = await ensureLocalModelLoaded(
      "zai-org/glm-4.7-flash",
      "http://127.0.0.1:1234/v1",
      undefined,
    );

    expect(result).toBeNull();
  });

  it("returns null when load endpoint is unsupported", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 404 })));

    const result = await ensureLocalModelLoaded(
      "zai-org/glm-4.7-flash",
      "http://127.0.0.1:1234/v1",
      undefined,
    );

    expect(result).toBeNull();
  });

  it("surfaces model-not-found errors returned as 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ error: { type: "model_not_found", message: "Model missing" } }),
          { status: 404 },
        ),
      ),
    );

    const result = await ensureLocalModelLoaded(
      "missing-model",
      "http://127.0.0.1:1234/v1",
      undefined,
    );

    expect(result).toBe("Model missing");
  });

  it("returns server error message on load failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ error: { message: "insufficient system resources" } }),
          { status: 500 },
        ),
      ),
    );

    const result = await ensureLocalModelLoaded(
      "devstral-small-2507-mlx",
      "http://127.0.0.1:1234/v1",
      undefined,
    );

    expect(result).toContain("insufficient system resources");
  });

  it("returns network errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("connection refused");
    }));

    const result = await ensureLocalModelLoaded(
      "zai-org/glm-4.7-flash",
      "http://127.0.0.1:1234/v1",
      undefined,
    );

    expect(result).toContain("Could not switch local model");
  });

  it("coalesces concurrent loads for same server+model", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const first = ensureLocalModelLoaded("gemma-3", "http://127.0.0.1:1234/v1", undefined);
    const second = ensureLocalModelLoaded("gemma-3", "http://127.0.0.1:1234/v1", undefined);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch?.(new Response("{}", { status: 200 }));
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toBeNull();
    expect(secondResult).toBeNull();
  });

  it("skips repeated loads for same model within throttle window", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const first = await ensureLocalModelLoaded("gemma-3", "http://127.0.0.1:1234/v1", undefined);
    const second = await ensureLocalModelLoaded("gemma-3", "http://127.0.0.1:1234/v1", undefined);

    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("caches unsupported load endpoint per server", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    const first = await ensureLocalModelLoaded("gemma-3", "http://127.0.0.1:1234/v1", undefined);
    const second = await ensureLocalModelLoaded("glm-4.7-flash", "http://127.0.0.1:1234/v1", undefined);

    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
