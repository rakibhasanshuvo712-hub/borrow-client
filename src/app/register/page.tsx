"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient, authErrorMessage } from "@/lib/auth-client";

type AccountRole = "renter" | "owner" | "both";

function RegisterForm() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();

  const rawRole = params.get("role");
  const initialRole: AccountRole =
    rawRole === "owner" ? "owner" : rawRole === "both" ? "both" : "renter";
  const [role, setRole] = useState<AccountRole>(initialRole);

  const { data: session, isPending: sessionPending } = authClient.useSession();
  const signedInManually = useRef(false);

  useEffect(() => {
    if (!sessionPending && session && !signedInManually.current) {
      router.replace("/");
    }
  }, [sessionPending, session, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);

    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "").trim();
    const email = String(f.get("email") || "").trim().toLowerCase();
    const password = String(f.get("password") || "");

    if (name.length < 2) {
      toast.error("Name must be at least 2 characters");
      setBusy(false);
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      setBusy(false);
      return;
    }

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
        // The backend accepts 'renter', 'owner', or 'both' (defaults to 'renter'):
        accountType: role || "renter",
      } as Parameters<typeof authClient.signUp.email>[0]);

      if (error) {
        toast.error(error.message || "Failed to create account. Please check your details.");
        return;
      }

      signedInManually.current = true;
      toast.success("Your account is ready!");

      // Refresh query client so SiteHeader updates immediately
      queryClient.invalidateQueries({ queryKey: ["me"] });

      // Navigate to the user's role-specific dashboard
      const targetDashboard =
        role === "owner" || role === "both" ? "/dashboard/owner" : "/dashboard/renter";
      router.push(targetDashboard);
      router.refresh();
    } catch (err) {
      toast.error(authErrorMessage(err, "Registration failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <main className="auth-wrap">
        <form className="card auth" onSubmit={handleSubmit}>
          <div className="eyebrow">JOIN YOUR NEIGHBOURS</div>
          <h1>Create your account</h1>

          <label>
            Your name
            <input name="name" required minLength={2} autoComplete="name" placeholder="Full Name" />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </label>

          <fieldset>
            <legend>I want to</legend>
            <div className="roles">
              {[
                ["renter", "Rent items"],
                ["owner", "List my items"],
                ["both", "Do both"],
              ].map(([v, l]) => (
                <button
                  type="button"
                  key={v}
                  aria-pressed={role === v}
                  onClick={() => setRole(v as AccountRole)}
                  className={role === v ? "selected" : ""}
                >
                  {l}
                </button>
              ))}
            </div>
          </fieldset>

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </button>

          <p>
            Already a member? <Link href="/login">Log in</Link>
          </p>
        </form>
      </main>

      <style jsx>{`
        .auth-wrap {
          min-height: 75vh;
          display: grid;
          place-items: center;
          padding: 30px;
        }
        .auth {
          width: min(100%, 460px);
          padding: 30px;
          display: grid;
          gap: 15px;
        }
        .auth h1 {
          margin: 0;
          font-size: 30px;
        }
        .auth label {
          font-size: 13px;
          font-weight: 600;
        }
        .auth input {
          display: block;
          width: 100%;
          padding: 12px;
          border: 1px solid #e2e6ee;
          border-radius: 12px;
          margin-top: 6px;
        }
        .auth p {
          color: #64748b;
          text-align: center;
          font-size: 14px;
        }
        .auth p a {
          color: #665fe3;
          font-weight: 700;
        }
        fieldset {
          border: 0;
          padding: 0;
        }
        legend {
          font-weight: 700;
          font-size: 13px;
          margin-bottom: 8px;
        }
        .roles {
          display: flex;
          gap: 8px;
        }
        .roles button {
          flex: 1;
          padding: 10px 5px;
          border: 1px solid #e2e6ee;
          border-radius: 11px;
          background: #fff;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .roles .selected {
          border-color: #7065e9;
          background: #f2f0ff;
          color: #5f57d1;
          font-weight: 700;
        }
      `}</style>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: "75vh", display: "grid", placeItems: "center", color: "#64748b" }}>
          Loading registration…
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
