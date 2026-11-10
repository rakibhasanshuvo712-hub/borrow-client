import { createAuthClient } from "better-auth/react";
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const authClient = createAuthClient({ baseURL: API_BASE_URL, fetchOptions: { credentials: "include" } });

export function authErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  const message = error instanceof Error ? error.message : "";
  if (!message || message === "Failed to fetch") {
    return `Cannot reach the BorrowHub API at ${API_BASE_URL}. Make sure the server is running.`;
  }
  return message || fallback;
}
