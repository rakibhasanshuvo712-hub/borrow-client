export class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); this.name = "ApiError"; } }
export type Envelope<T> = { success: boolean; data: T; message: string; meta?: { page?: number; limit?: number; total?: number; pages?: number } };
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, { ...init, credentials: "include", headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers } });
  } catch {
    throw new ApiError(`Cannot reach the BorrowHub API at ${API_BASE_URL}. Make sure the server is running.`, 0);
  }
  const text = await response.text();
  let result: Envelope<T> | undefined;
  try { result = text ? JSON.parse(text) as Envelope<T> : undefined; } catch { result = undefined; }
  if (!response.ok || !result?.success) throw new ApiError(result?.message || `Request failed (${response.status})`, response.status);
  return result.data;
}
export type Item = { _id: string; name: string; category: string; brand?: string; description: string; images: string[]; condition: string; pricing: { daily: number; weekly: number; monthly: number }; deposit: number; location?: { area?: string; city?: string }; avgRating: number; reviewCount: number; phone?: string; quantity?: number; status?: string; owner?: { name?: string; image?: string; isVerified?: boolean; phone?: string } };
export type Category = { slug: string; name: string; icon?: string };
export const money = (value: number) => `৳${value.toLocaleString("en-BD")}`;
export const isImageSrc = (value?: string | null): value is string => Boolean(value && (/^https?:\/\/\S+$/i.test(value) || value.startsWith("/")));
