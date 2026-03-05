export const LOCAL_OPENAI_PROVIDER_ID = "local-openai";
export const DEFAULT_LOCAL_OPENAI_BASE_URL = "http://127.0.0.1:1234/v1";
export const DEFAULT_LOCAL_OPENAI_API_KEY = "lm-studio";

const CHAT_COMPLETIONS_SUFFIX = "/chat/completions";

/** Normalize an OpenAI-compatible base URL to the `/v1` API root. */
export function normalizeOpenAICompatibleBaseUrl(input: string): string | null {
  try {
    const url = new URL(input.trim());

    let pathname = url.pathname.replace(/\/+$/, "");
    if (pathname.endsWith(CHAT_COMPLETIONS_SUFFIX)) {
      pathname = pathname.slice(0, -CHAT_COMPLETIONS_SUFFIX.length);
    }

    if (!pathname || pathname === "/") {
      pathname = "/v1";
    } else if (!pathname.endsWith("/v1")) {
      pathname = `${pathname}/v1`;
    }

    url.pathname = pathname;
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export function isLocalOpenAIProvider(providerId: string): boolean {
  return providerId === LOCAL_OPENAI_PROVIDER_ID;
}

export function resolveLocalOpenAIApiKey(apiKey: string | undefined): string {
  const key = apiKey?.trim();
  return key && key.length > 0 ? key : DEFAULT_LOCAL_OPENAI_API_KEY;
}

export function resolveLocalOpenAIBaseUrl(baseUrl: string | undefined): string {
  const normalized = baseUrl
    ? normalizeOpenAICompatibleBaseUrl(baseUrl)
    : normalizeOpenAICompatibleBaseUrl(DEFAULT_LOCAL_OPENAI_BASE_URL);

  return normalized ?? DEFAULT_LOCAL_OPENAI_BASE_URL;
}
