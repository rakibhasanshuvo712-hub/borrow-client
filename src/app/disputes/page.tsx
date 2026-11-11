"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Phone,
  Plus,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { api, type Dispute } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { getItemImage } from "@/lib/images";

type MyBooking = {
  _id: string;
  item: { _id: string; name: string; images?: string[]; pricing?: { daily: number }; phone?: string };
  startDate: string;
  endDate: string;
  status: string;
  renter: string;
  owner: string;
};

export default function DisputesPage() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"list" | "new">("list");
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [resolveNote, setResolveNote] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  // Form states for new dispute
  const [bookingId, setBookingId] = useState("");
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");

  // Fetch disputes
  const { data: disputes, isLoading: disputesLoading } = useQuery<Dispute[]>({
    queryKey: ["disputes"],
    queryFn: () => api<Dispute[]>("/disputes"),
    enabled: Boolean(session?.user),
  });

  // Fetch single selected dispute details
  const { data: activeDispute, isLoading: detailLoading } = useQuery<Dispute>({
    queryKey: ["dispute", selectedDisputeId],
    queryFn: () => api<Dispute>(`/disputes/${selectedDisputeId}`),
    enabled: Boolean(selectedDisputeId && session?.user),
  });

  // Fetch user bookings to populate the dispute dropdown
  const { data: myBookings } = useQuery<MyBooking[]>({
    queryKey: ["bookings", "mine"],
    queryFn: () => api<MyBooking[]>("/bookings/mine"),
    enabled: Boolean(session?.user && tab === "new"),
  });

  // Mutation: Open new dispute
  const createDispute = useMutation({
    mutationFn: (body: { bookingId: string; reason: string; severity: string }) =>
      api("/disputes", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (data: unknown) => {
      toast.success("Dispute filed successfully");
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      setBookingId("");
      setReason("");
      setTab("list");
      if (data && typeof data === "object" && "_id" in data) {
        setSelectedDisputeId((data as { _id: string })._id);
      }
    },
    onError: (err: Error) => toast.error(err.message || "Failed to submit dispute"),
  });

  // Mutation: Send message in dispute thread
  const sendMessage = useMutation({
    mutationFn: (text: string) =>
      api(`/disputes/${selectedDisputeId}/messages`, {
        method: "POST",
        body: JSON.stringify({ text }),
      }),
    onSuccess: () => {
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["dispute", selectedDisputeId] });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      toast.success("Response sent");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to send response"),
  });

  // Mutation: Resolve dispute
  const resolveDispute = useMutation({
    mutationFn: (note: string) =>
      api(`/disputes/${selectedDisputeId}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ resolutionNote: note }),
      }),
    onSuccess: () => {
      setIsResolving(false);
      setResolveNote("");
      queryClient.invalidateQueries({ queryKey: ["dispute", selectedDisputeId] });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      toast.success("Dispute marked as solved!");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to resolve dispute"),
  });

  if (sessionPending) {
    return (
      <main className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        Loading dispute center…
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="container" style={{ padding: "80px 0", textAlign: "center", maxWidth: 500 }}>
        <AlertTriangle size={48} color="#eab308" style={{ margin: "0 auto 16px" }} />
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Solve Dispute & Complaints</h1>
        <p style={{ color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>
          Please sign in to view your rental disputes or file a complaint with an owner or renter.
        </p>
        <Link href="/login?next=/disputes" className="btn btn-primary" style={{ padding: "12px 24px" }}>
          Sign in to your account
        </Link>
      </main>
    );
  }

  const disputeList = disputes ?? [];
  const currentDispute = activeDispute || disputeList.find((d) => d._id === selectedDisputeId);

  return (
    <>
      <main className="container" style={{ padding: "40px 0 80px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 30 }}>
          <div>
            <div className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck size={14} color="#6366f1" /> RESOLUTION CENTER
            </div>
            <h1 style={{ fontSize: "clamp(26px, 4vw, 36px)", margin: "6px 0 4px" }}>
              Solve <span className="gradient-text">Disputes & Complaints</span>
            </h1>
            <p style={{ color: "#64748b", margin: 0 }}>
              Direct dispute resolution between renters and owners. Chat, negotiate, and solve complaints mutually.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { setTab("list"); setSelectedDisputeId(null); }}
              className={`btn ${tab === "list" && !selectedDisputeId ? "btn-primary" : "btn-secondary"}`}
            >
              My Disputes ({disputeList.length})
            </button>
            <button
              onClick={() => setTab("new")}
              className={`btn ${tab === "new" ? "btn-primary" : "btn-warm"}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={16} /> File New Complaint
            </button>
          </div>
        </div>

        {/* Tab 1: File New Complaint */}
        {tab === "new" ? (
          <div className="card" style={{ maxWidth: 650, margin: "0 auto", padding: 32 }}>
            <h2 style={{ fontSize: 22, marginTop: 0, marginBottom: 6 }}>File a complaint / dispute</h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
              Select the rental booking you are having an issue with and describe the complaint clearly.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!bookingId) {
                  toast.error("Please select a rental booking");
                  return;
                }
                createDispute.mutate({ bookingId, reason, severity });
              }}
              style={{ display: "grid", gap: 18 }}
            >
              <label style={{ fontSize: 14, fontWeight: 600 }}>
                Select Rental Booking:
                <select
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  required
                  style={{ display: "block", width: "100%", padding: 12, marginTop: 6, borderRadius: 10, border: "1px solid #cbd5e1" }}
                >
                  <option value="" disabled>Choose a booking...</option>
                  {(myBookings ?? []).map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.item?.name || "Rental"} ({b.startDate?.slice(0, 10)} to {b.endDate?.slice(0, 10)}) — Status: {b.status}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ fontSize: 14, fontWeight: 600 }}>
                Severity Level:
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as "low" | "medium" | "high")}
                  style={{ display: "block", width: "100%", padding: 12, marginTop: 6, borderRadius: 10, border: "1px solid #cbd5e1" }}
                >
                  <option value="low">Low (Minor issue / late pickup)</option>
                  <option value="medium">Medium (Deposit dispute / condition issue)</option>
                  <option value="high">High (Damaged item / unreturned / urgent)</option>
                </select>
              </label>

              <label style={{ fontSize: 14, fontWeight: 600 }}>
                Explain your complaint / problem:
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain what happened, what was agreed upon, and what resolution you are requesting from the other party..."
                  required
                  minLength={10}
                  rows={5}
                  style={{ display: "block", width: "100%", padding: 12, marginTop: 6, borderRadius: 10, border: "1px solid #cbd5e1", resize: "vertical" }}
                />
              </label>

              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <button
                  type="submit"
                  disabled={createDispute.isPending}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: 14, fontSize: 16 }}
                >
                  {createDispute.isPending ? "Submitting…" : "Submit Complaint"}
                </button>
                <button
                  type="button"
                  onClick={() => setTab("list")}
                  className="btn btn-secondary"
                  style={{ padding: 14 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : selectedDisputeId && currentDispute ? (
          /* Dispute Detail & Thread View */
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 24, alignItems: "start" }}>
            {/* Left: Chat & Resolution Thread */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #edf0f5", paddingBottom: 14 }}>
                <div>
                  <button
                    onClick={() => setSelectedDisputeId(null)}
                    style={{ fontSize: 13, color: "#6366f1", fontWeight: 700, background: "none", border: 0, padding: 0, cursor: "pointer", marginBottom: 4 }}
                  >
                    ← Back to all disputes
                  </button>
                  <h2 style={{ fontSize: 20, margin: 0 }}>Complaint Discussion Thread</h2>
                </div>
                <span className={`chip ${currentDispute.status === "resolved" ? "chip-green" : currentDispute.status === "investigating" ? "chip-purple" : "chip-amber"}`}>
                  {currentDispute.status}
                </span>
              </div>

              {/* Original Reason */}
              <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>
                  Original Complaint
                </div>
                <p style={{ margin: "6px 0 0", color: "#78350f", fontSize: 14, lineHeight: 1.6 }}>
                  {currentDispute.reason}
                </p>
              </div>

              {/* Message Thread */}
              <div style={{ display: "grid", gap: 12, maxHeight: 420, overflowY: "auto", paddingRight: 6, marginBottom: 20 }}>
                {(currentDispute.messages ?? []).map((msg, i) => {
                  const isMe = msg.sender === session?.user?.id;
                  return (
                    <div
                      key={i}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 14,
                        maxWidth: "85%",
                        alignSelf: isMe ? "end" : "start",
                        background: isMe ? "linear-gradient(110deg,#eef2ff,#f5f3ff)" : "#f8fafc",
                        border: isMe ? "1px solid #c7d2fe" : "1px solid #e2e8f0",
                        marginLeft: isMe ? "auto" : 0,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                        <b style={{ color: isMe ? "#4338ca" : "#334155" }}>
                          {isMe ? "You" : msg.senderName || msg.senderRole} ({msg.senderRole})
                        </b>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.5 }}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box or Resolved Notice */}
              {currentDispute.status === "resolved" ? (
                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "16px 20px", borderRadius: 14, textAlign: "center" }}>
                  <CheckCircle2 size={26} color="#10b981" style={{ margin: "0 auto 6px" }} />
                  <b style={{ color: "#065f46", fontSize: 16, display: "block" }}>This dispute has been solved!</b>
                  {currentDispute.resolutionNote && (
                    <p style={{ color: "#047857", fontSize: 13, margin: "6px 0 0" }}>
                      Resolution note: {currentDispute.resolutionNote}
                    </p>
                  )}
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!replyText.trim()) return;
                    sendMessage.mutate(replyText);
                  }}
                  style={{ display: "flex", gap: 10 }}
                >
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a message to explain your side or negotiate a solution..."
                    style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1" }}
                  />
                  <button
                    type="submit"
                    disabled={sendMessage.isPending || !replyText.trim()}
                    className="btn btn-primary"
                    style={{ padding: "12px 18px", display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <Send size={15} /> Send
                  </button>
                </form>
              )}
            </div>

            {/* Right: Rental Info & Both Parties (Phone Numbers & Solve Action) */}
            <div style={{ display: "grid", gap: 16 }}>
              {/* Item Card in Dispute */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 10 }}>
                  Rental Item
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 68, height: 68, borderRadius: 12, overflow: "hidden", background: "#f1f5f9", flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentDispute.booking?.item ? getItemImage(currentDispute.booking.item as never) : ""}
                      alt={currentDispute.booking?.item?.name || "Item"}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>{currentDispute.booking?.item?.name || "Rental"}</h3>
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      {currentDispute.booking?.startDate?.slice(0, 10)} to {currentDispute.booking?.endDate?.slice(0, 10)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Both Parties & Phone Numbers */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 14 }}>
                  Parties Involved
                </div>

                {/* Owner Info */}
                <div style={{ padding: "12px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <User size={15} color="#6366f1" />
                      <b style={{ fontSize: 14 }}>{currentDispute.owner?.name || "Owner"}</b>
                    </div>
                    <span className="chip chip-purple" style={{ fontSize: 11 }}>Owner</span>
                  </div>
                  {(currentDispute.owner?.phone || currentDispute.booking?.item?.phone) && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <Phone size={13} color="#4338ca" />
                      <a href={`tel:${currentDispute.owner?.phone || currentDispute.booking?.item?.phone}`} style={{ color: "#4338ca", fontWeight: 700 }}>
                        {currentDispute.owner?.phone || currentDispute.booking?.item?.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Renter Info */}
                <div style={{ padding: "12px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <User size={15} color="#059669" />
                      <b style={{ fontSize: 14 }}>{currentDispute.renter?.name || "Renter"}</b>
                    </div>
                    <span className="chip chip-green" style={{ fontSize: 11 }}>Renter</span>
                  </div>
                  {currentDispute.renter?.phone && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <Phone size={13} color="#059669" />
                      <a href={`tel:${currentDispute.renter?.phone}`} style={{ color: "#059669", fontWeight: 700 }}>
                        {currentDispute.renter?.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Solve Dispute Action Card */}
              {currentDispute.status !== "resolved" && (
                <div className="card" style={{ padding: 20, background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1px solid #86efac" }}>
                  <h3 style={{ fontSize: 16, margin: "0 0 6px", color: "#166534" }}>Ready to Solve Dispute?</h3>
                  <p style={{ color: "#15803d", fontSize: 13, margin: "0 0 14px", lineHeight: 1.5 }}>
                    Once both parties have reached an agreement (item returned, deposit refunded, or mutual accord), click below to solve and close the dispute.
                  </p>

                  {isResolving ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      <textarea
                        value={resolveNote}
                        onChange={(e) => setResolveNote(e.target.value)}
                        placeholder="Resolution note (e.g., mutually resolved, deposit settled)..."
                        rows={3}
                        style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #86efac" }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => resolveDispute.mutate(resolveNote)}
                          disabled={resolveDispute.isPending}
                          className="btn btn-success"
                          style={{ flex: 1, padding: 10 }}
                        >
                          {resolveDispute.isPending ? "Solving…" : "Confirm & Solve"}
                        </button>
                        <button
                          onClick={() => setIsResolving(false)}
                          className="btn btn-secondary"
                          style={{ padding: 10 }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsResolving(true)}
                      className="btn btn-success"
                      style={{ width: "100%", padding: "12px 14px", fontSize: 14 }}
                    >
                      <CheckCircle2 size={16} /> Mark as Solved
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* List of Disputes */
          <div>
            {disputesLoading ? (
              <p style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Loading disputes…</p>
            ) : disputeList.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "60px 20px", maxWidth: 520, margin: "0 auto" }}>
                <CheckCircle2 size={44} color="#10b981" style={{ margin: "0 auto 12px" }} />
                <h3 style={{ fontSize: 20, margin: "0 0 6px" }}>No Disputes or Complaints</h3>
                <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 20px" }}>
                  All your rentals are in good standing! If any issue arises with a renter or owner, you can file a complaint here to resolve it directly.
                </p>
                <button onClick={() => setTab("new")} className="btn btn-primary">
                  <Plus size={16} /> File New Complaint
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {disputeList.map((d) => (
                  <div
                    key={d._id}
                    onClick={() => setSelectedDisputeId(d._id)}
                    className="card"
                    style={{
                      padding: "18px 22px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      cursor: "pointer",
                      transition: "transform 0.15s, box-shadow 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: d.status === "resolved" ? "#dcfce7" : "#fef3c7",
                          display: "grid",
                          placeItems: "center",
                          color: d.status === "resolved" ? "#16a34a" : "#d97706",
                          flexShrink: 0,
                        }}
                      >
                        {d.status === "resolved" ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <h3 style={{ margin: 0, fontSize: 16 }}>{d.booking?.item?.name || "Rental Dispute"}</h3>
                          <span className={`chip ${d.status === "resolved" ? "chip-green" : d.status === "investigating" ? "chip-purple" : "chip-amber"}`}>
                            {d.status}
                          </span>
                        </div>
                        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13, maxWidth: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {d.reason}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                      <div style={{ textAlign: "right", fontSize: 12, color: "#64748b" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={12} /> {new Date(d.createdAt).toLocaleDateString()}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <MessageSquare size={12} /> {d.messages?.length ?? 1} message{(d.messages?.length ?? 1) > 1 ? "s" : ""}
                        </div>
                      </div>
                      <span style={{ color: "#6366f1", fontWeight: 700, fontSize: 14 }}>
                        View Discussion →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
