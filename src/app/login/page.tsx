"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { toast } from "sonner";

function LoginForm() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const signedInManually = useRef(false);

  useEffect(() => {
    if (!sessionPending && session && !signedInManually.current) {
      router.replace(target || "/");
    }
  }, [sessionPending, session, target, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);

    try {
      const email = String(f.get("email") || "").trim().toLowerCase();
      const password = String(f.get("password") || "");

      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        toast.error(error.message || "Failed to sign in. Please check your credentials.");
        return;
      }

      signedInManually.current = true;
      toast.success("Signed in successfully!");

      await queryClient.invalidateQueries({ queryKey: ["me"] });

      if (target) {
        router.push(target);
      } else {
        try {
          const me = await api<{ role?: string; canList?: boolean }>("/me");
          router.push(
            me?.role === "admin"
              ? "/dashboard/admin"
              : me?.canList === true || me?.role === "owner"
              ? "/dashboard/owner"
              : "/dashboard/renter"
          );
        } catch {
          router.push("/");
        }
      }
      router.refresh();
    } catch (err) {
      toast.error(authErrorMessage(err, "Sign in failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <main className="auth-wrap">
        <form className="card auth" onSubmit={handleSubmit}>
          <div className="eyebrow">WELCOME BACK</div>
          <h1>Log in to BorrowHub</h1>

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
              autoComplete="current-password"
              placeholder="Your password"
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Logging in…" : "Log in"}
          </button>

          <p>
            New to BorrowHub? <Link href="/register">Create an account</Link>
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
          width: min(100%, 440px);
          padding: 30px;
          display: grid;
          gap: 16px;
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
      `}</style>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: "75vh", display: "grid", placeItems: "center", color: "#64748b" }}>
          Loading sign in…
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
