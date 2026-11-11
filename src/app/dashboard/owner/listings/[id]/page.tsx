"use client";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, type Category, type Item } from "@/lib/api";

const FIELDS: [string, string, boolean][] = [
  ["name", "Item name", true],
  ["category", "Category", true],
  ["brand", "Brand (optional)", false],
  ["image", "Photo URL (optional)", false],
  ["phone", "Contact phone", true],
  ["quantity", "Units available", true],
  ["daily", "Daily price ৳", true],
  ["weekly", "Weekly price ৳", true],
  ["monthly", "Monthly price ৳", true],
  ["deposit", "Refundable deposit ৳", true],
  ["area", "Area", true],
  ["city", "City", true],
];

type ListingItem = Item & {
  location?: { area?: string; city?: string; coordinates?: { type?: string; coordinates?: [number, number] } };
  includes?: string[];
};

export default function EditListing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: item, isLoading, error } = useQuery({
    queryKey: ["item", id],
    queryFn: () => api<ListingItem>(`/items/${id}`),
    enabled: Boolean(id),
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });

  const update = useMutation({
    mutationFn: (body: object) => api(`/items/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success("Listing updated");
      void queryClient.invalidateQueries({ queryKey: ["item", id] });
      void queryClient.invalidateQueries({ queryKey: ["items", "mine"] });
      void queryClient.invalidateQueries({ queryKey: ["items"] });
      router.push("/dashboard/owner/listings");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => api<{ deleted: boolean }>(`/items/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Listing deleted");
      void queryClient.invalidateQueries({ queryKey: ["items", "mine"] });
      void queryClient.invalidateQueries({ queryKey: ["items"] });
      router.push("/dashboard/owner/listings");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <main className="container" style={{ padding: "44px 0 75px" }}>Loading your listing…</main>;
  if (error || !item)
    return (
      <main className="container" style={{ padding: "44px 0 75px", maxWidth: 760 }}>
        <p role="alert">We couldn&apos;t load this listing. It may have been deleted.</p>
        <Link className="btn btn-secondary" href="/dashboard/owner/listings">Back to my listings</Link>
      </main>
    );

  const values: Record<string, string> = {
    name: item.name ?? "",
    category: item.category ?? "",
    brand: item.brand ?? "",
    image: item.images?.[0] ?? "",
    phone: item.phone ?? "",
    quantity: String(item.quantity ?? 1),
    daily: String(item.pricing?.daily ?? ""),
    weekly: String(item.pricing?.weekly ?? ""),
    monthly: String(item.pricing?.monthly ?? ""),
    deposit: String(item.deposit ?? 0),
    area: item.location?.area ?? "",
    city: item.location?.city ?? "",
  };

  return (
    <>
      <main className="container" style={{ padding: "44px 0 75px", maxWidth: 760 }}>
        <div className="eyebrow">EDIT YOUR LISTING</div>
        <h1 style={{ fontSize: 34, margin: "6px 0 4px" }}>{item.name}</h1>
        <p style={{ color: "#64748b", marginTop: 0 }}>
          Changes go live right away. <Link href={`/items/${id}`} style={{ color: "#665fe3", fontWeight: 700 }}>View the public page</Link>
        </p>
        <form
          className="card"
          style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const num = (key: string) => Number(f.get(key));
            const image = String(f.get("image") ?? "").trim();
            const body = {
              name: f.get("name"),
              category: f.get("category"),
              brand: String(f.get("brand") ?? "").trim(),
              description: String(f.get("description") ?? item.description ?? ""),
              includes: item.includes ?? [],
              images: image ? [image] : [],
              condition: String(f.get("condition") ?? item.condition ?? "Good"),
              phone: String(f.get("phone") ?? "").trim(),
              quantity: num("quantity") || 1,
              pricing: { daily: num("daily"), weekly: num("weekly"), monthly: num("monthly") },
              deposit: num("deposit"),
              location: {
                area: f.get("area"),
                city: f.get("city"),
                coordinates: item.location?.coordinates ?? { type: "Point" as const, coordinates: [0, 0] as [number, number] },
              },
              pickupOption: "both",
            };
            update.mutate(body);
          }}
        >
          {FIELDS.map(([name, label, required]) =>
            name === "category" ? (
              <label key={name} style={{ fontSize: 13, fontWeight: 600 }}>
                {label}
                <select name="category" className="input" defaultValue={values.category} required>
                  <option value="" disabled>Choose a category</option>
                  {(categories ?? []).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  {values.category && !(categories ?? []).some((c) => c.slug === values.category) && (
                    <option value={values.category}>{values.category}</option>
                  )}
                </select>
              </label>
            ) : (
              <label key={name} style={{ fontSize: 13, fontWeight: 600 }}>
                {label}
                <input
                  required={required}
                  name={name}
                  defaultValue={values[name]}
                  type={["daily", "weekly", "monthly", "deposit", "quantity"].includes(name) ? "number" : name === "image" ? "url" : name === "phone" ? "tel" : "text"}
                  min={name === "deposit" ? 0 : 1}
                  placeholder={name === "phone" ? "01XXXXXXXXX" : undefined}
                  className="input"
                />
              </label>
            )
          )}
          <label>
            Condition
            <select name="condition" className="input" defaultValue={item.condition || "Good"}>
              {["New", "Like New", "Excellent", "Good", "Fair"].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label style={{ gridColumn: "1/-1" }}>
            Description
            <textarea name="description" required minLength={10} className="input" rows={5} defaultValue={item.description} placeholder="Describe your item, what's included, and any usage rules..." />
          </label>
          <div style={{ gridColumn: "1/-1", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-primary" style={{ flex: "1 1 220px", fontSize: 16, padding: 15 }} disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              className="btn"
              style={{ background: "#fff1f2", color: "#be123c", padding: "15px 20px" }}
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm(`Delete "${item.name}"? This cannot be undone.`)) remove.mutate();
              }}
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </form>
        <p style={{ fontSize: 13, color: "#64748b" }}>
          <Link href="/dashboard/owner/listings">← Back to all listings</Link>
        </p>
      </main>
      <style jsx>{`.input{display:block;width:100%;padding:11px;border:1px solid #e3e6ed;border-radius:11px;margin-top:6px}`}</style>
    </>
  );
}
