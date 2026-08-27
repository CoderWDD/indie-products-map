import type { LinkStatus } from "./types";

export type FetchPageResult = {
  linkStatus: Omit<LinkStatus, "projectSlug" | "checkedAt">;
  html: string | null;
};

export type FetchPageOptions = {
  timeoutMs?: number;
  maxRedirects?: number;
  maxBytes?: number;
};

const defaultOptions = {
  timeoutMs: 10_000,
  maxRedirects: 3,
  maxBytes: 500 * 1024,
};

export async function fetchPage(
  rawUrl: string | null,
  options: FetchPageOptions = {},
): Promise<FetchPageResult> {
  const settings = { ...defaultOptions, ...options };
  const initialUrl = normalizeHttpUrl(rawUrl);

  if (!initialUrl) {
    return {
      linkStatus: {
        url: rawUrl ?? "missing-url",
        status: "invalid_url",
        httpStatus: null,
        finalUrl: null,
        errorMessage: "Missing or invalid HTTP URL.",
      },
      html: null,
    };
  }

  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= settings.maxRedirects; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), settings.timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent": "indie-products-map-link-checker",
        },
        redirect: "manual",
        signal: controller.signal,
      });

      const httpStatus = response.status;

      if (isRedirect(httpStatus)) {
        const location = response.headers.get("location");
        if (!location) {
          return statusResult(initialUrl, "http_error", httpStatus, currentUrl, "Redirect without location.");
        }

        if (redirectCount === settings.maxRedirects) {
          return statusResult(initialUrl, "http_error", httpStatus, currentUrl, "Too many redirects.");
        }

        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (httpStatus === 404) {
        return statusResult(initialUrl, "http_404", httpStatus, currentUrl, "HTTP 404.");
      }

      if (httpStatus === 401 || httpStatus === 403 || httpStatus === 429) {
        return statusResult(initialUrl, "blocked", httpStatus, currentUrl, `HTTP ${httpStatus}.`);
      }

      if (httpStatus < 200 || httpStatus >= 400) {
        return statusResult(initialUrl, "http_error", httpStatus, currentUrl, `HTTP ${httpStatus}.`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!isHtmlContent(contentType)) {
        return statusResult(initialUrl, "non_html", httpStatus, currentUrl, `Content-Type: ${contentType || "unknown"}.`);
      }

      const html = await readLimitedText(response, settings.maxBytes);
      if (html.trim().length === 0) {
        return statusResult(initialUrl, "empty_content", httpStatus, currentUrl, "Empty response body.");
      }

      return {
        linkStatus: {
          url: initialUrl,
          status: "ok",
          httpStatus,
          finalUrl: currentUrl,
          errorMessage: null,
        },
        html,
      };
    } catch (error) {
      if (isAbortError(error)) {
        return statusResult(initialUrl, "timeout", null, currentUrl, "Request timed out.");
      }

      const message = error instanceof Error ? error.message : "Unknown fetch error.";
      const status = /ENOTFOUND|EAI_AGAIN|DNS|fetch failed/i.test(message)
        ? "dns_error"
        : "unknown_error";

      return statusResult(initialUrl, status, null, currentUrl, message);
    } finally {
      clearTimeout(timeout);
    }
  }

  return statusResult(initialUrl, "unknown_error", null, currentUrl, "Unexpected redirect loop exit.");
}

function normalizeHttpUrl(rawUrl: string | null) {
  if (!rawUrl) {
    return null;
  }

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function statusResult(
  url: string,
  status: FetchPageResult["linkStatus"]["status"],
  httpStatus: number | null,
  finalUrl: string | null,
  errorMessage: string,
): FetchPageResult {
  return {
    linkStatus: {
      url,
      status,
      httpStatus,
      finalUrl,
      errorMessage,
    },
    html: null,
  };
}

function isRedirect(status: number) {
  return status >= 300 && status < 400;
}

function isHtmlContent(contentType: string) {
  return /\btext\/html\b|\bapplication\/xhtml\+xml\b/i.test(contentType);
}

async function readLimitedText(response: Response, maxBytes: number) {
  const reader = response.body?.getReader();
  if (!reader) {
    return "";
  }

  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let bytesRead = 0;

  while (bytesRead < maxBytes) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const remainingBytes = maxBytes - bytesRead;
    const chunk = value.byteLength > remainingBytes ? value.slice(0, remainingBytes) : value;
    chunks.push(decoder.decode(chunk, { stream: true }));
    bytesRead += chunk.byteLength;
  }

  chunks.push(decoder.decode());
  await reader.cancel().catch(() => undefined);
  return chunks.join("");
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
