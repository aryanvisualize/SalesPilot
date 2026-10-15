const rawApiUrl = import.meta.env.VITE_API_URL;

// Ensure base URL has no trailing slashes and falls back to localhost for local dev
const API_BASE_URL = rawApiUrl
  ? rawApiUrl.replace(/\/+$/, "")
  : "http://localhost:5000";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("salespilot_token");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = `${API_BASE_URL}${normalizedPath}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "An unexpected error occurred.");
  }

  return data;
}
