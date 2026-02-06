import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(160deg, #111827 0%, #0b0f14 50%, #020617 100%)",
          color: "#ffffff",
          padding: 56,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", fontSize: 28, color: "#93c5fd" }}>Steam Profile Checker</div>
          <div style={{ display: "flex", fontSize: 66, fontWeight: 700, lineHeight: 1.1 }}>
            Check Steam Profiles in Seconds
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#d1d5db" }}>
          Trust-style score from public Steam signals.
        </div>
      </div>
    ),
    size
  );
}
