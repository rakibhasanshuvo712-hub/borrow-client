import { createAuthClient } from "better-auth/react";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  fetchOptions: {
    credentials: "include", // CRITICAL: ensures session cookies are transmitted cross-origin
  },
});

export function authErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
    const msg = (error as { message: string }).message;
    if (msg === "Failed to fetch") {
      return `Cannot reach the BorrowHub API at ${API_BASE_URL}. Make sure the server is running.`;
    }
    return msg || fallback;
  }
  const message = error instanceof Error ? error.message : "";
  if (!message || message === "Failed to fetch") {
    return `Cannot reach the BorrowHub API at ${API_BASE_URL}. Make sure the server is running.`;
  }
  return message || fallback;
}
