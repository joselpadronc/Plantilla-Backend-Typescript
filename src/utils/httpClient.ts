export type RequestOptions = {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  body?: any;
  timeoutMs?: number; // timeout per request
  retries?: number; // number of retries on network failure
  retryDelayMs?: number; // initial delay for retry backoff
  responseType?: "json" | "text" | "arrayBuffer" | "blob";
};

export class HttpError extends Error {
  status?: number;
  response?: any;
  constructor(message: string, status?: number, response?: any) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.response = response;
  }
}

function buildUrlWithParams(url: string, params?: Record<string, any>) {
  if (!params || Object.keys(params).length === 0) return url;
  const u = new URL(url, "http://localhost");
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    u.searchParams.append(k, String(v));
  });
  // If the provided url was absolute, URL(url, base) returns correct absolute; otherwise it may be relative
  // We return pathname+search when input was relative
  if (/^https?:\/\//i.test(url)) return u.toString();
  // preserve relative path
  return u.pathname + u.search;
}

async function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function httpRequest<T = any>(opts: RequestOptions): Promise<T> {
  const {
    url,
    method = "GET",
    headers = {},
    params,
    body,
    timeoutMs = 10000,
    retries = 0,
    retryDelayMs = 300,
    responseType = "json",
  } = opts;

  // prefer global fetch (Node 18+ or browser). If not available, fail with actionable message.
  const fetchFn: typeof fetch | undefined = (globalThis as any).fetch;
  if (typeof fetchFn !== "function") {
    throw new Error(
      "fetch is not available in this runtime. Install a fetch polyfill (e.g. node-fetch) or upgrade to Node 18+."
    );
  }

  const finalUrl = buildUrlWithParams(url, params);

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body !== undefined && body !== null) {
        // If body is an object and no content-type, assume JSON
        if (typeof body === "object" && !(body instanceof FormData) && !headers["content-type"]) {
          init.body = JSON.stringify(body);
          init.headers = { ...init.headers, "content-type": "application/json" } as any;
        } else {
          init.body = body as any;
        }
      }

      const resp = await fetchFn(finalUrl, init as any);
      clearTimeout(timer);

      const text = await resp.text();
      const isJson = (resp.headers.get && resp.headers.get("content-type") || "").includes("application/json");

      if (!resp.ok) {
        // Try to parse body
        let parsed: any = text;
        try {
          parsed = isJson ? JSON.parse(text) : text;
        } catch (_) {
          // leave parsed as text
        }
        throw new HttpError(`Request failed with status ${resp.status}`, resp.status, parsed);
      }

      // parse according to responseType preference
      if (responseType === "json") {
        try {
          return isJson ? (JSON.parse(text) as T) : ((text as unknown) as T);
        } catch (err) {
          // If parsing fails, return text
          return (text as unknown) as T;
        }
      }

      if (responseType === "text") return (text as unknown) as T;
      if (responseType === "arrayBuffer") return (await resp.arrayBuffer()) as unknown as T;
      if (responseType === "blob") return (await resp.blob()) as unknown as T;

      return (text as unknown) as T;
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      // if aborted due to timeout, treat as network error and maybe retry
      if (err.name === "AbortError") {
        // fallthrough to retry logic
      } else if (err instanceof HttpError) {
        // Do not retry for HTTP errors (4xx/5xx), break
        throw err;
      }

      // retry logic
      attempt += 1;
      if (attempt > retries) break;
      const backoff = retryDelayMs * Math.pow(2, attempt - 1);
      await delay(backoff);
    }
  }

  // If we exit loop with an error, throw lastError or generic
  if (lastError) throw lastError;
  throw new Error("httpRequest failed without a specific error");
}

export default httpRequest;
