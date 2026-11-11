"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, Phone, Star } from "lucide-react";
import { money, type Item } from "@/lib/api";
import { getItemImage, DEFAULT_FALLBACK_IMAGE } from "@/lib/images";

export function ItemCard({ item }: { item: Item }) {
  const fallback = getItemImage(item);
  const rawImage = item.images?.[0]?.trim();
  const initialImage = rawImage && rawImage.startsWith("http") ? rawImage : fallback;
  const [imgSrc, setImgSrc] = useState(initialImage);

  return (
    <Link href={`/items/${item._id}`} className="card" style={{ overflow: "hidden", display: "block" }}>
      <div style={{ height: 210, background: "#f1f2f8", position: "relative", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={item.name}
          loading="lazy"
          onError={() => {
            if (imgSrc !== fallback) {
              setImgSrc(fallback);
            } else if (imgSrc !== DEFAULT_FALLBACK_IMAGE) {
              setImgSrc(DEFAULT_FALLBACK_IMAGE);
            }
          }}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <span
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            background: "#ffffffed",
            padding: "6px 10px",
            borderRadius: 30,
            fontSize: 11,
            fontWeight: 700,
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          }}
        >
          {item.condition}
        </span>
      </div>

      <div style={{ padding: 18 }}>
        <div style={{ fontSize: 11, color: "#7c69eb", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
          {item.category}
        </div>
        <h3 style={{ fontSize: 18, margin: "6px 0 9px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.name}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: 13 }}>
          <MapPin size={14} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
            {item.location?.area || item.location?.city || "Bangladesh"}
          </span>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, color: "#a16207", flexShrink: 0 }}>
            <Star size={14} fill="currentColor" />
            {item.avgRating ? item.avgRating.toFixed(1) : "New"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #eef0f4", marginTop: 14, paddingTop: 13 }}>
          <div style={{ fontWeight: 800 }}>
            {money(item.pricing?.daily || 0)}
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}> / day</span>
          </div>
          {item.phone && (
            <span style={{ fontSize: 11, color: "#4338ca", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, background: "#eef2ff", padding: "4px 8px", borderRadius: 6 }}>
              <Phone size={11} /> {item.phone}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
