"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";

type CurrentUser = { id: string; name?: string; role: "renter" | "owner" | "admin"; canRent?: boolean; canList?: boolean };

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  // isPending stays true until better-auth has actually resolved the session,
  // so a refresh of a dashboard URL never gets mistaken for "logged out".
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: () => api<CurrentUser>("/me"),
    retry: false,
    enabled: Boolean(session),
  });

  useEffect(() => {
    if (sessionPending || isLoading) return;
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(path)}`);
      return;
    }
    if (!user) {
      if (isError) router.replace(`/login?next=${encodeURIComponent(path)}`);
      return;
    }
    const allowed = path.includes("/admin") ? user.role === "admin" : path.includes("/owner") ? user.role === "owner" || user.role === "admin" || user.canList === true : user.canRent !== false;
    if (!allowed) {
      router.replace(user.role === "admin" ? "/dashboard/admin" : user.canList ? "/dashboard/owner" : "/dashboard/renter");
    }
  }, [isError, isLoading, path, router, user, session, sessionPending]);

  if (sessionPending || isLoading || !user)
    return (
      <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", color: "#64748b" }}>
        {isError || (!session && !sessionPending) ? "Taking you to sign in…" : "Loading your account…"}
      </main>
    );

  const name = user.name || session?.user?.name || "there";
  const initial = name[0]?.toUpperCase() || "U";

  return (
    <>
      <div className="gradient-hero" style={{ padding: "26px 0", color: "#fff" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="profile-avatar-lg">{initial}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", opacity: 0.9 }}>
              {user.role} account
            </div>
            <h1 style={{ fontSize: 26, margin: "4px 0 0" }}>Hi, {name.split(" ")[0]}!</h1>
          </div>
        </div>
      </div>
      {children}
      <style jsx>{`
        .profile-avatar-lg {
          width: 54px; height: 54px; border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
          border: 2px solid rgba(255, 255, 255, 0.5);
          display: grid; place-items: center;
          font-family: var(--font-poppins); font-weight: 700; font-size: 22px;
        }
      `}</style>
    </>
  );
}
