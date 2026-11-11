"use client";
import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { CalendarDays, MapPin, Package, Phone, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { FavoriteToggle } from "@/components/favorite-toggle";
import { authClient } from "@/lib/auth-client";
import { api, money, type Item } from "@/lib/api";
import { getItemImage, DEFAULT_FALLBACK_IMAGE } from "@/lib/images";

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: resolved } = use(params);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [booked, setBooked] = useState(false);
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const { data: item, isLoading, error } = useQuery({
    queryKey: ["item", resolved],
    queryFn: () => api<Item & { bookedDates: { startDate: string; endDate: string }[] }>(`/items/${resolved}`),
    enabled: Boolean(resolved),
  });

  const quote = useMutation({
    mutationFn: () => api<{ days: number; pricing: { rentalTotal: number; serviceFee: number; deposit: number; grandTotal: number } }>("/bookings/quote", { method: "POST", body: JSON.stringify({ itemId: resolved, startDate: start, endDate: end }) }),
    onError: (e: Error) => toast.error(e.message),
  });

  const request = useMutation({
    mutationFn: () => api("/bookings", { method: "POST", body: JSON.stringify({ itemId: resolved, startDate: start, endDate: end }) }),
    onSuccess: () => { setBooked(true); toast.success("Booking request sent — view it in My bookings"); },
    onError: (e: Error) => toast.error(e.message),
  });

  // Guests can browse, but renting needs an account.
  const requireLogin = () => router.push(`/login?next=${encodeURIComponent(`/items/${resolved}`)}`);

  if (isLoading || !item) return <main className="container" style={{ padding: 80, textAlign: "center" }}>{error ? "Item not found" : "Loading item details…"}</main>;
  const mainPhoto = getItemImage(item);
  const additionalPhotos = (item.images ?? []).filter((s) => s && s !== mainPhoto);
  const ownerPhone = item.phone || item.owner?.phone;

  const unavailable = item.bookedDates || [];
  const overlaps = (from: string, to: string) => unavailable.some(d => from <= d.endDate.slice(0, 10) && to >= d.startDate.slice(0, 10));
  const invalidRange = Boolean(start && end && start > end);
  const unavailableRange = Boolean(start && end && overlaps(start, end));

  return (
    <>
      <main className="container" style={{ paddingTop: 36, paddingBottom: 70 }}>
        <div className="details">
          <div>
            <div className="gallery">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mainPhoto}
                alt={item.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== DEFAULT_FALLBACK_IMAGE) target.src = DEFAULT_FALLBACK_IMAGE;
                }}
              />
            </div>
            {additionalPhotos.length > 0 && (
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                {additionalPhotos.map((src, i) => (
                  <div key={src} className="thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${item.name} view ${i + 2}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== DEFAULT_FALLBACK_IMAGE) target.src = DEFAULT_FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <h1 style={{ fontSize: 36, marginBottom: 8 }}>{item.name}</h1>
              <FavoriteToggle item={item} />
            </div>
            <div style={{ display: "flex", gap: 14, color: "#64748b", fontSize: 14, flexWrap: "wrap" }}>
              <span><MapPin size={15} style={{ verticalAlign: "middle" }} /> {item.location?.area || item.location?.city || "Bangladesh"}</span>
              <span><Star size={15} fill="#f59e0b" color="#f59e0b" style={{ verticalAlign: "middle" }} /> {item.avgRating?.toFixed(1) || "New"} ({item.reviewCount || 0} reviews)</span>
              <span><Package size={15} style={{ verticalAlign: "middle" }} /> {item.quantity ?? 1} available</span>
            </div>
            <p style={{ lineHeight: 1.8, color: "#475569", marginTop: 25 }}>{item.description}</p>
            <div className="owner">
              <div className="owner-avatar">{item.owner?.name?.[0] || "O"}</div>
              <div>
                <b>{item.owner?.name || "Local owner"}</b>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{item.owner?.isVerified && <><ShieldCheck size={14} color="#6366f1" /> Verified owner</>}</div>
              </div>
            </div>
            {ownerPhone && (
              <div style={{ marginTop: 22 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                  Contact owner directly:
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a className="contact-row" href={`tel:${ownerPhone}`} style={{ flex: 1, minWidth: 200 }}>
                    <span className="contact-icon"><Phone size={17} /></span>
                    <span>
                      <small>Call Owner</small>
                      <b>{ownerPhone}</b>
                    </span>
                  </a>
                  <a
                    className="contact-row"
                    href={`https://wa.me/${ownerPhone.replace(/\D/g, "").replace(/^0/, "880")}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ flex: 1, minWidth: 160, background: "linear-gradient(110deg,#ecfdf5,#d1fae5)", color: "#065f46", border: "1px solid #a7f3d0" }}
                  >
                    <span className="contact-icon" style={{ color: "#10b981", fontSize: 18 }}>💬</span>
                    <span>
                      <small style={{ color: "#059669" }}>Chat on WhatsApp</small>
                      <b>Message Owner</b>
                    </span>
                  </a>
                </div>
              </div>
            )}
          </div>

          <aside className="booking card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div><b style={{ fontSize: 23 }}>{money(item.pricing.daily)}</b><span style={{ color: "#64748b" }}> / day</span></div>
              <span style={{ color: "#b45309", fontSize: 13 }}>★ {item.avgRating?.toFixed(1) || "New"}</span>
            </div>
            <div className="price-rows"><span>Weekly</span><b>{money(item.pricing.weekly)}</b><span>Monthly</span><b>{money(item.pricing.monthly)}</b></div>
            <div className="stock-row"><Package size={15} color="#6366f1" /><span><b>{item.quantity ?? 1}</b> unit{(item.quantity ?? 1) > 1 ? "s" : ""} available</span></div>
            {ownerPhone && (
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "11px 14px", borderRadius: 12, margin: "14px 0", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eef2ff", display: "grid", placeItems: "center", color: "#6366f1", flexShrink: 0 }}>
                  <Phone size={15} />
                </div>
                <div style={{ fontSize: 13 }}>
                  <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 700 }}>Owner Phone</div>
                  <a href={`tel:${ownerPhone}`} style={{ fontWeight: 800, color: "#4338ca", fontSize: 15, textDecoration: "none" }}>
                    {ownerPhone}
                  </a>
                </div>
              </div>
            )}

            {booked ? (
              <div className="booked-success">
                <ShieldCheck size={28} color="#10b981" />
                <h3 style={{ margin: "8px 0 4px" }}>Request sent!</h3>
                <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 16px" }}>We&apos;ll notify you once the owner confirms your booking.</p>
                <Link className="btn btn-success" style={{ width: "100%" }} href="/dashboard/renter">View My bookings</Link>
                <button className="btn btn-secondary" style={{ width: "100%", marginTop: 10 }} onClick={() => { setBooked(false); quote.reset(); }}>Book another</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 17 }}><CalendarDays size={17} style={{ verticalAlign: "middle" }} /> Choose rental dates</h3>
                <label className="date">Start date<input type="date" min={format(new Date(), "yyyy-MM-dd")} value={start} onChange={e => { setStart(e.target.value); if (end && e.target.value > end) setEnd(""); quote.reset(); }} /></label>
                <label className="date">End date<input type="date" min={start || format(addDays(new Date(), 1), "yyyy-MM-dd")} value={end} onChange={e => { setEnd(e.target.value); quote.reset(); }} /></label>
                {invalidRange ? <p style={{ color: "#b91c1c", fontSize: 13 }}>The end date must be after the start date.</p> : unavailableRange ? <p style={{ color: "#b91c1c", fontSize: 13 }}>Unavailable dates selected. Pick a range outside the booked dates.</p> : null}
                <button className="btn btn-secondary" style={{ width: "100%", marginTop: 15 }} disabled={session ? (!start || !end || invalidRange || unavailableRange || quote.isPending) : false} onClick={() => (session ? quote.mutate() : requireLogin())}>{session ? "Get rental quote" : "Log in to rent"}</button>
                {quote.data && (
                  <div className="quote">
                    <div><span>Rental ({quote.data.days} days)</span><b>{money(quote.data.pricing.rentalTotal)}</b></div>
                    <div><span>Service fee</span><b>{money(quote.data.pricing.serviceFee)}</b></div>
                    <div><span>Refundable deposit</span><b>{money(quote.data.pricing.deposit)}</b></div>
                    <div className="total"><span>Total</span><b>{money(quote.data.pricing.grandTotal)}</b></div>
                    <button className="btn btn-primary book-now" style={{ width: "100%", marginTop: 12 }} disabled={request.isPending} onClick={() => (session ? request.mutate() : requireLogin())}>
                      {request.isPending ? "Booking…" : "Book now"}
                    </button>
                  </div>
                )}
                <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}><ShieldCheck size={14} style={{ verticalAlign: "middle" }} /> Your booking is confirmed after owner approval.</p>
              </>
            )}
          </aside>
        </div>
      </main>
      <style jsx>{`
        .details{display:grid;grid-template-columns:1fr 360px;gap:36px;align-items:start}
        .gallery{height:420px;position:relative;border-radius:24px;overflow:hidden;background:linear-gradient(135deg,#eef2ff,#fae8ff)}
        .thumb{width:105px;height:75px;position:relative;border-radius:12px;overflow:hidden;background:linear-gradient(135deg,#eef2ff,#fae8ff)}
        .owner{border-top:1px solid #e9ebf1;padding-top:18px;display:flex;align-items:center;gap:12px}
        .owner-avatar{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#ec4899);color:#fff;display:grid;place-items:center;font-weight:800}
        .booking{padding:22px;position:sticky;top:95px}
        .price-rows{display:grid;grid-template-columns:1fr auto;gap:10px;padding:16px 0;border-block:1px solid #edf0f4;margin:16px 0;color:#64748b;font-size:13px}
        .price-rows b{color:#0f172a}
        .stock-row{display:flex;align-items:center;gap:8px;font-size:13px;color:#475569;padding-bottom:14px;border-bottom:1px solid #edf0f4;margin-bottom:4px}
        .contact-row{display:flex;align-items:center;gap:12px;margin-top:16px;padding:14px;border:1px solid #e9ebf1;border-radius:16px;background:linear-gradient(110deg,#eef2ff,#fae8ff);color:#4c1d95;text-decoration:none}
        .contact-row:hover{box-shadow:0 8px 22px #8b5cf626}
        .contact-row small{display:block;font-size:11px;color:#7c74c9;text-transform:uppercase;letter-spacing:.06em}
        .contact-row b{font-size:16px}
        .contact-icon{width:38px;height:38px;border-radius:12px;background:#fff;display:grid;place-items:center;color:#6366f1;flex:none}
        .date{display:block;font-size:12px;color:#64748b;margin:10px 0}
        .date input{display:block;width:100%;padding:10px;margin-top:5px;border:1px solid #e5e7ef;border-radius:10px}
        .quote{margin-top:18px;padding-top:12px;border-top:1px solid #edf0f4}
        .quote div{display:flex;justify-content:space-between;padding:6px 0;font-size:13px}
        .quote .total{border-top:1px solid #edf0f4;margin-top:6px;padding-top:12px;font-size:16px;font-weight:800}
        .booked-success{text-align:center;padding:18px 4px}
        .book-now{font-size:16px;padding:15px}
        @media(max-width:850px){.details{grid-template-columns:1fr}.booking{position:static}.gallery{height:min(90vw,420px)}}
      `}</style>
    </>
  );
}
