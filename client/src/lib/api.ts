// Centralized API utility for all backend requests
// Usage: apiRequest(endpoint, { method, body, protected: true })

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function apiRequest(
  endpoint: string,
  {
    method = "GET",
    body,
    protected: isProtected = false,
    headers = {},
  }: {
    method?: string;
    body?: unknown;
    protected?: boolean;
    headers?: Record<string, string>;
  } = {}
) {
  const token = isProtected ? localStorage.getItem("token") : null;
  const allHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };
  if (isProtected && token) {
    allHeaders["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: allHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = undefined;
  }
  if (!res.ok) {
    throw data || { error: "Unknown error" };
  }
  return data;
}
