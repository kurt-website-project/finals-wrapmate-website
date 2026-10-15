const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:4000";

const TOKEN_KEY = "wrapmate_token";

export const IDENTITY_UPDATED_EVENT = "wrapmate:identity-updated";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  isForm?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, auth = true, isForm = false } = options;

  const headers: Record<string, string> = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: isForm
      ? (body as FormData)
      : body !== undefined
        ? JSON.stringify(body)
        : undefined,
  });

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data
        ? (data as { error: string }).error
        : null) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

export async function uploadFile(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<{ url: string }>("/api/upload", {
    method: "POST",
    body: form,
    isForm: true,
  });
}

export { API_URL };
