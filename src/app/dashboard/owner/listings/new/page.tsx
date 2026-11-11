"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, type Category } from "@/lib/api";

export default function NewListing() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => api<Category[]>("/categories") });
  const create = useMutation({
    mutationFn: (body: object) => api("/items", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Listing published — view it on the homepage");
      router.push("/");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <main className="container" style={{ padding: "44px 0 75px", maxWidth: 760 }}>
        <div className="eyebrow">SHARE SOMETHING USEFUL</div>
        <h1 style={{ fontSize: 34, margin: "6px 0 4px" }}>Add a <span className="gradient-text">new listing</span></h1>
        <p style={{ color: "#64748b", marginTop: 0 }}>Fill in the details below to rent out your item.</p>
        <form className="card" style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const f = new FormData(e.currentTarget);
          const num = (key: string) => Number(f.get(key));
          const image = String(f.get("image"));
          const body = {
            name: f.get("name"), category: f.get("category"), brand: f.get("brand"),
            description: f.get("description"), includes: [], images: image ? [image] : [],
            condition: f.get("condition"),
            phone: String(f.get("phone") ?? "").trim(),
            quantity: num("quantity") || 1,
            pricing: { daily: num("daily"), weekly: num("weekly"), monthly: num("monthly") },
            deposit: num("deposit"),
            location: { area: f.get("area"), city: f.get("city"), coordinates: { type: "Point", coordinates: [0, 0] } },
            pickupOption: "both",
          };
          try { await create.mutateAsync(body); } finally { setBusy(false); }
        }}>
          {([
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
          ] as [string, string, boolean][]).map(([name, label, required]) =>
            name === "category" ? (
              <label key={name} style={{ fontSize: 13, fontWeight: 600 }}>{label}
                <select name="category" className="input" defaultValue="" required>
                  <option value="" disabled>Choose a category</option>
                  {(categories ?? []).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </label>
            ) : (
              <label key={name} style={{ fontSize: 13, fontWeight: 600 }}>{label}
                <input
                  required={required}
                  name={name}
                  type={["daily", "weekly", "monthly", "deposit", "quantity"].includes(name) ? "number" : name === "image" ? "url" : name === "phone" ? "tel" : "text"}
                  min={name === "deposit" ? 0 : 1}
                  defaultValue={name === "quantity" ? 1 : undefined}
                  placeholder={name === "phone" ? "01XXXXXXXXX" : undefined}
                  className="input"
                />
              </label>
            )
          )}
          <label>Condition
            <select name="condition" className="input">
              <option>Like New</option><option>New</option><option>Excellent</option><option>Good</option><option>Fair</option>
            </select>
          </label>
          <label style={{ gridColumn: "1/-1" }}>Description
            <textarea name="description" required minLength={10} className="input" rows={5} placeholder="Describe your item, what's included, and any usage rules..." />
          </label>
          <button className="btn btn-primary" style={{ gridColumn: "1/-1", fontSize: 16, padding: 15 }} disabled={busy || create.isPending}>
            {busy || create.isPending ? "Publishing…" : "Publish listing"}
          </button>
        </form>
      </main>
      <style jsx>{`.input{display:block;width:100%;padding:11px;border:1px solid #e3e6ed;border-radius:11px;margin-top:6px}`}</style>
    </>
  );
}
