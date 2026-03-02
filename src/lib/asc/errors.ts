export type AscErrorCategory = "auth" | "connection" | "api";

export interface AscError {
  category: AscErrorCategory;
  message: string;
  statusCode?: number;
}

/**
 * Parse an ASC API error response into a structured AscError.
 * Extracts the first `errors[].detail` from JSON:API envelope when available.
 */
export function parseAscError(status: number, responseText: string): AscError {
  let detail: string | undefined;

  try {
    const body = JSON.parse(responseText);
    detail = body?.errors?.[0]?.detail;
  } catch {
    // Not JSON – use default messages below
  }

  if (status === 401 || status === 403) {
    return {
      category: "auth",
      message: detail ?? "API key may be invalid or expired",
      statusCode: status,
    };
  }

  if (status >= 500) {
    return {
      category: "connection",
      message: detail ?? "App Store Connect is temporarily unavailable",
      statusCode: status,
    };
  }

  return {
    category: "api",
    message: detail ?? `App Store Connect returned an error (${status})`,
    statusCode: status,
  };
}

/** Build an AscError for a network-level failure (no HTTP response). */
export function networkError(): AscError {
  return {
    category: "connection",
    message: "Could not connect to App Store Connect",
  };
}
