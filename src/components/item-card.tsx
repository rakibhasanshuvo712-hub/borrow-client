"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MapPin, Star } from "lucide-react";
import { isImageSrc, money, type Item } from "@/lib/api";

function Placeholder() {
  return <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#94a3b8" }}>Photo coming soon</div>;
}

export function ItemCard({ item }: { item: Item }) {
  const image = item.images?.find(isImageSrc);
  const [failed, setFailed] = useState(false);
  return (
    <Link href={`/items/${item._id}`} className="card" style={{ overflow: "hidden", display: "block" }}>
      <div style={{ height: 210, background: "#f1f2f8", position: "relative" }}>
        {image && !failed ? (
          <Image
            src={image}
            alt={item.name}
            fill
            sizes="(max-width:700px) 90vw, 30vw"
            style={{ objectFit: "cover" }}
            onError={() => setFailed(true)}
          />
        ) : (
          <Placeholder />
        )}
        <span style={{ position: "absolute", top: 12, left: 12, background: "#ffffffed", padding: "6px 10px", borderRadius: 30, fontSize: 11, fontWeight: 700 }}>{item.condition}</span>
      </div>
      <div style={{ padding: 18 }}>
        <div style={{ fontSize: 11, color: "#7c69eb", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>{item.category}</div>
        <h3 style={{ fontSize: 18, margin: "6px 0 9px" }}>{item.name}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: 13 }}>
          <MapPin size={14} />
          {item.location?.area || item.location?.city || "Bangladesh"}
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, color: "#a16207" }}>
            <Star size={14} fill="currentColor" />
            {item.avgRating?.toFixed(1) || "New"}
          </span>
        </div>
        <div style={{ borderTop: "1px solid #eef0f4", marginTop: 14, paddingTop: 13, fontWeight: 800 }}>
          {money(item.pricing.daily)}
          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>/ day</span>
        </div>
      </div>
    </Link>
  );
}
