import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
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
            "radial-gradient(circle at 20% 20%, #1f2937 0%, #0b0f14 45%, #05070a 100%)",
          color: "#ffffff",
          padding: 56,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", fontSize: 28, color: "#93c5fd" }}>Steam Profile Checker</div>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>
            Fast Trust-Style Steam Profile Checks
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "#d1d5db" }}>
            Account age, bans, library footprint, and social signals.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 420,
              height: 22,
              display: "flex",
              borderRadius: 999,
              background: "#1f2937",
              border: "1px solid #334155",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "82%",
                height: "100%",
                background: "#34d399",
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: "#34d399" }}>
            82 / 100
          </div>
        </div>
      </div>
    ),
    size
  );
}
