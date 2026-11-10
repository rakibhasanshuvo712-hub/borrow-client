"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Heart, Plus, Search } from "lucide-react";
import { api } from "@/lib/api";

type Booking = { _id: string; status: string; startDate: string; endDate: string; item?: { name?: string; images?: string[] } };
type Me = { id: string; role: string; canList?: boolean };

const statusStyle: Record<string, string> = {
  pending: "chip-amber",
  confirmed: "chip-green",
  active: "chip-cyan",
  completed: "chip-purple",
  cancelled: "chip-pink",
  rejected: "chip-pink",
};

export default function RenterDashboard() {
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => api<Me>("/me"), retry: false });
  const { data, isLoading, error } = useQuery({ queryKey: ["bookings", "renter"], queryFn: () => api<Booking[]>("/bookings/mine?role=renter") });
  const canList = me?.canList === true || me?.role === "owner" || me?.role === "admin";
  return (
    <>
      <main className="container" style={{ padding: "36px 0 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div className="eyebrow">YOUR BORROWHUB</div>
            <h1 style={{ fontSize: 32, margin: "6px 0" }}>Renter dashboard</h1>
            <p style={{ color: "#64748b", margin: 0 }}>Keep track of your rentals and saved items.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href="/explore"><Search size={17} /> Explore items</Link>
            {canList && <Link className="btn btn-warm" href="/dashboard/owner/listings/new"><Plus size={17} /> Add a listing</Link>}
            <Link className="btn btn-secondary" href="/favorites"><Heart size={17} /> Favorites</Link>
          </div>
        </div>

        <h2 style={{ marginTop: 32, display: "flex", alignItems: "center", gap: 10 }}>
          <span className="gradient-text">My bookings</span>
        </h2>
        {isLoading ? <p>Loading your bookings…</p> : error ? (
          <p role="alert">We couldn&apos;t load your bookings. Please refresh or sign in again.</p>
        ) : data?.length ? (
          <div style={{ display: "grid", gap: 14 }}>
            {data.map((b) => (
              <article className="card" key={b._id} style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                <div>
                  <b style={{ fontSize: 16 }}>{b.item?.name || "Rental"}</b>
                  <p style={{ color: "#64748b", marginBottom: 0, fontSize: 13, marginTop: 6 }}>
                    <CalendarDays size={14} style={{ verticalAlign: "middle" }} /> {new Date(b.startDate).toLocaleDateString("en-BD")} – {new Date(b.endDate).toLocaleDateString("en-BD")}
                  </p>
                </div>
                <span className={`chip ${statusStyle[b.status] || "chip-purple"}`}>{b.status.replaceAll("_", " ")}</span>
              </article>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "#64748b", borderColor: "#e9d5ff" }}>
            <p style={{ fontSize: 16, margin: "0 0 14px" }}>You haven&apos;t booked anything yet.</p>
            <Link className="btn btn-primary" href="/explore" style={{ marginTop: 4 }}>Find your first rental</Link>
          </div>
        )}
      </main>
    </>
  );
}
