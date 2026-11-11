"use client";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, money, type Item } from "@/lib/api";
import { getItemImage, DEFAULT_FALLBACK_IMAGE } from "@/lib/images";

const statusChip: Record<string, string> = {
  approved: "chip-green",
  pending: "chip-amber",
  rejected: "chip-pink",
  paused: "chip-purple",
};

export default function MyListings() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["items", "mine"],
    queryFn: () => api<Item[]>("/items/mine"),
    retry: false,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api<{ deleted: boolean }>(`/items/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Listing deleted");
      void queryClient.invalidateQueries({ queryKey: ["items", "mine"] });
      void queryClient.invalidateQueries({ queryKey: ["items"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirmDelete = (item: Item) => {
    if (window.confirm(`Delete "${item.name}"? This cannot be undone.`)) remove.mutate(item._id);
  };

  return (
    <main className="container" style={{ padding: "42px 0 80px" }}>
      <div className="listings-head">
        <div>
          <div className="eyebrow">OWNER WORKSPACE</div>
          <h1 style={{ fontSize: 38, margin: "6px 0" }}>My listings</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Edit your details, update availability, or remove items you no longer rent out.</p>
        </div>
        <Link className="btn btn-primary" href="/dashboard/owner/listings/new"><Plus size={17} /> Add a listing</Link>
      </div>

      {isLoading ? (
        <p>Loading your listings…</p>
      ) : error ? (
        <p role="alert">Couldn&apos;t load your listings. Please refresh and try again.</p>
      ) : data?.length ? (
        <div className="listing-grid">
          {data.map((item) => {
            const photo = getItemImage(item);
            return (
              <article className="card listing-card" key={item._id}>
                <div className="listing-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt={item.name}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== DEFAULT_FALLBACK_IMAGE) target.src = DEFAULT_FALLBACK_IMAGE;
                    }}
                  />
                </div>
                <div className="listing-body">
                  <div className="listing-top">
                    <div>
                      <div className="listing-cat">{item.category}</div>
                      <h2>{item.name}</h2>
                    </div>
                    <span className={`chip ${statusChip[item.status ?? "approved"] || "chip-purple"}`}>{item.status ?? "approved"}</span>
                  </div>
                  <div className="listing-meta">
                    <span>{money(item.pricing.daily)} / day</span>
                    <span><Package size={14} /> {item.quantity ?? 1} available</span>
                    {item.phone && <span><Phone size={14} /> {item.phone}</span>}
                  </div>
                  <div className="listing-actions">
                    <Link className="btn btn-secondary" href={`/dashboard/owner/listings/${item._id}`}><Pencil size={15} /> Edit</Link>
                    <button
                      className="btn"
                      style={{ background: "#fff1f2", color: "#be123c" }}
                      disabled={remove.isPending}
                      onClick={() => confirmDelete(item)}
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                    <Link className="btn" style={{ marginLeft: "auto", border: "1px solid #e3e6ef", background: "#fff" }} href={`/items/${item._id}`}>View listing</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card empty-state">
          <p style={{ fontSize: 17, margin: "0 0 6px" }}>You haven&apos;t listed anything yet.</p>
          <p style={{ color: "#64748b", margin: "0 0 18px" }}>Share something useful and start earning from items sitting idle.</p>
          <Link className="btn btn-primary" href="/dashboard/owner/listings/new"><Plus size={17} /> Add your first listing</Link>
        </div>
      )}

      <style jsx>{`
        .listings-head{display:flex;justify-content:space-between;align-items:end;gap:18px;flex-wrap:wrap}
        .listing-grid{display:grid;gap:16px;margin-top:26px}
        .listing-card{display:grid;grid-template-columns:190px 1fr;overflow:hidden}
        .listing-photo{height:100%;min-height:150px;background:linear-gradient(135deg,#eef2ff,#fae8ff);display:grid;place-items:center;overflow:hidden}
        .listing-photo img{width:100%;height:100%;object-fit:cover}
        .listing-body{padding:18px 20px}
        .listing-top{display:flex;justify-content:space-between;gap:12px;align-items:start}
        .listing-cat{font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#7c69eb}
        .listing-top h2{font:600 20px var(--font-poppins);margin:5px 0 0}
        .listing-meta{display:flex;flex-wrap:wrap;gap:16px;color:#64748b;font-size:13px;margin:14px 0 16px}
        .listing-meta span{display:inline-flex;align-items:center;gap:6px}
        .listing-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
        .empty-state{padding:46px;text-align:center;margin-top:26px;border-style:dashed}
        @media(max-width:700px){.listing-card{grid-template-columns:1fr}.listing-photo{min-height:170px}}
      `}</style>
    </main>
  );
}
