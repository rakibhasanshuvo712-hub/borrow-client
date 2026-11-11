export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export type Envelope<T> = {
  success: boolean;
  data: T;
  message: string;
  errors?: Record<string, unknown> | string[];
  meta?: { page?: number; limit?: number; total?: number; pages?: number };
};

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response | undefined;
  const targetUrl = `${API_BASE_URL}/api${path}`;
  let primaryError: unknown;

  try {
    response = await fetch(targetUrl, {
      ...init,
      credentials: "include",
      headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
    });
  } catch (err) {
    primaryError = err;
    // If running in browser and cross-origin fetch failed, try same-origin proxy fallback
    if (typeof window !== "undefined" && !targetUrl.startsWith(window.location.origin)) {
      try {
        response = await fetch(`/api${path}`, {
          ...init,
          credentials: "include",
          headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
        });
      } catch (fallbackErr) {
        console.error("API fallback /api request also failed:", fallbackErr);
      }
    }
    if (!response) {
      console.error("BorrowHub API request failed:", targetUrl, primaryError);
      throw new ApiError(
        `Cannot reach the BorrowHub API at ${API_BASE_URL}. Make sure the server is running.`,
        0
      );
    }
  }

  const text = await response.text();
  let result: Envelope<T> | undefined;
  try {
    result = text ? (JSON.parse(text) as Envelope<T>) : undefined;
  } catch {
    result = undefined;
  }

  if (!response.ok || !result?.success) {
    let msg = result?.message;
    if (result?.errors && typeof result.errors === "object") {
      const errorDetails = Object.entries(result.errors)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join("; ");
      if (errorDetails) msg = `${msg || "Validation error"}: ${errorDetails}`;
    }
    if (!msg && response.status === 401) msg = "Please sign in to continue.";
    throw new ApiError(msg || `Request failed (${response.status})`, response.status);
  }

  return result.data;
}
export type Item = { _id: string; name: string; category: string; brand?: string; description: string; images: string[]; condition: string; pricing: { daily: number; weekly: number; monthly: number }; deposit: number; location?: { area?: string; city?: string }; avgRating: number; reviewCount: number; phone?: string; quantity?: number; status?: string; owner?: { name?: string; image?: string; isVerified?: boolean; phone?: string } };
export type Category = { slug: string; name: string; icon?: string };
export const money = (value: number) => `৳${value.toLocaleString("en-BD")}`;
export const isImageSrc = (value?: string | null): value is string => Boolean(value && (/^https?:\/\/\S+$/i.test(value) || value.startsWith("/")));

export type DisputeMessage = {
  sender: string;
  senderName: string;
  senderRole: "renter" | "owner" | "admin";
  text: string;
  createdAt: string;
};

export type Dispute = {
  _id: string;
  booking: {
    _id: string;
    item?: { _id: string; name: string; images?: string[]; pricing?: { daily: number }; phone?: string };
    startDate?: string;
    endDate?: string;
    status?: string;
    renter?: string;
    owner?: string;
  };
  openedBy: string;
  reason: string;
  severity: "low" | "medium" | "high";
  status: "open" | "investigating" | "resolved";
  evidence?: string[];
  resolutionNote?: string;
  messages?: DisputeMessage[];
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  renter?: { name?: string; phone?: string; role?: string };
  owner?: { name?: string; phone?: string; role?: string };
};
