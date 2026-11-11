"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, LogOut, Menu, MessageCircle, Package, Plus, User, X } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";

type Me = { id: string; name?: string; role: "renter" | "owner" | "admin"; canRent?: boolean; canList?: boolean };

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => api<Me>("/me"),
    enabled: Boolean(session),
    retry: false,
  });
  // The profile query is cached, so after logging out we must ignore it —
  // otherwise the header keeps showing the previous account's name.
  const signedIn = Boolean(session);
  const name = signedIn ? me?.name || session?.user?.name || "" : "";
  const initial = name ? name[0].toUpperCase() : "U";
  const dashboardHref = me?.role === "admin" ? "/dashboard/admin" : me?.role === "owner" ? "/dashboard/owner" : "/dashboard/renter";
  // Only owners/admins (and "do both" accounts) get the Add listing button —
  // renters never see it.
  const canList = signedIn && (me?.canList === true || me?.role === "owner" || me?.role === "admin");

  return (
    <header className="glass" style={{ position: "sticky", top: 0, zIndex: 30, borderBottom: "1px solid #eef0f5" }}>
      <div className="container" style={{ height: 76, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <Link href="/" style={{ fontFamily: "var(--font-poppins)", fontWeight: 700, fontSize: 25, letterSpacing: -1 }}>
          Borrow<span className="gradient-text" style={{ fontWeight: 800 }}>Hub</span>
        </Link>
        <nav className="desktop-nav" style={{ display: "flex", gap: 28, fontWeight: 600, fontSize: 14, color: "#475569" }}>
          <Link href="/explore">Explore</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/about">About</Link>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {canList && <Link href="/dashboard/owner/listings/new" className="btn btn-warm nav-add"><Plus size={17} /> Add listing</Link>}
          <Link aria-label="Favorites" href="/favorites" className="icon-link"><Heart size={19} /></Link>
          <Link aria-label="Messages" href="/messages" className="icon-link"><MessageCircle size={19} /></Link>
          {sessionPending ? (
            <span className="avatar" aria-hidden="true" style={{ opacity: 0.4 }} />
          ) : name ? (
            <div style={{ position: "relative" }}>
              <button aria-label="Profile" className="profile-btn" onClick={() => setMenu(!menu)}>
                <span className="avatar">{initial}</span>
                <span className="profile-name">{name.split(" ")[0]}</span>
              </button>
              {menu && (
                <div className="profile-menu" onMouseLeave={() => setMenu(false)}>
                  <div className="profile-head">
                    <span className="avatar lg">{initial}</span>
                    <div><b>{name}</b><small>{me?.role}</small></div>
                  </div>
                  <Link href={dashboardHref} onClick={() => setMenu(false)}><User size={16} /> My dashboard</Link>
                  {canList && <Link href="/dashboard/owner/listings/new" onClick={() => setMenu(false)}><Plus size={16} /> Add a listing</Link>}
                  {canList && <Link href="/dashboard/owner/listings" onClick={() => setMenu(false)}><Package size={16} /> My listings</Link>}
                  <Link href="/dashboard/renter" onClick={() => setMenu(false)}><Heart size={16} /> My bookings</Link>
                  <button onClick={async () => {
                    try {
                      const result = await authClient.signOut();
                      if (result.error) throw new Error(result.error.message || "Could not log out");
                      setMenu(false);
                      // Drop the cached profile so the header resets immediately.
                      queryClient.removeQueries({ queryKey: ["me"] });
                      // Logging out always lands back on the homepage.
                      router.push("/");
                      router.refresh();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not log out");
                    }
                  }}><LogOut size={16} /> Log out</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary" style={{ padding: "11px 17px" }}>Log in</Link>
              <Link href="/register" className="btn btn-primary" style={{ padding: "11px 17px" }}>Sign up</Link>
            </>
          )}
          <button className="mobile-toggle" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && (
        <nav className="mobile-menu">
          <Link href="/explore">Explore</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/about">About</Link>
          {canList && <Link href="/dashboard/owner/listings/new"><Plus size={16} /> Add a listing</Link>}
          {!sessionPending && !name && <Link href="/register">Sign up</Link>}
        </nav>
      )}
      <style jsx>{`
        .icon-link{width:40px;height:40px;border-radius:13px;background:linear-gradient(135deg,#eef2ff,#fae8ff);display:grid;place-items:center;color:#5c5fce}
        .profile-btn{display:flex;align-items:center;gap:9px;border:0;background:linear-gradient(110deg,#eef2ff,#fae8ff);padding:6px 12px 6px 6px;border-radius:999px;font-weight:700;font-size:13px;color:#4c1d95;cursor:pointer}
        .profile-btn:hover{box-shadow:0 6px 18px #8b5cf633}
        .avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#ec4899);color:#fff;display:grid;place-items:center;font-weight:800;font-size:14px}
        .avatar.lg{width:42px;height:42px;font-size:18px}
        .profile-name{max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .profile-menu{position:absolute;right:0;top:54px;background:#fff;border:1px solid #eef0f5;border-radius:18px;box-shadow:0 20px 50px #1e293b1f;padding:12px;width:230px;display:grid;gap:4px;z-index:40}
        .profile-menu a,.profile-menu button{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:12px;font-size:13px;font-weight:600;color:#334155;background:transparent;border:0;text-align:left;cursor:pointer;width:100%}
        .profile-menu a:hover,.profile-menu button:hover{background:linear-gradient(110deg,#eef2ff,#fae8ff)}
        .profile-head{display:flex;align-items:center;gap:11px;padding:8px 10px 12px;border-bottom:1px solid #eef0f5;margin-bottom:6px}
        .profile-head b{display:block;font-size:14px;color:#0f172a}
        .profile-head small{color:#94a3b8;font-size:11px;text-transform:capitalize}
        .mobile-toggle,.mobile-menu{display:none}
        .nav-add{padding:10px 15px;font-size:13px}
        @media(max-width:740px){
          .desktop-nav{display:none!important}
          .nav-add{display:none}
          .mobile-toggle{display:grid;place-items:center;border:0;background:transparent;color:#334155}
          .mobile-menu{display:grid;padding:8px 22px 18px;gap:17px;color:#475569;font-weight:600}
          .profile-name{display:none}
        }
      `}</style>
    </header>
  );
}
