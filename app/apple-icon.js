import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 20%, #1f2937 0%, #0b0f14 60%, #05070a 100%)",
          color: "#34d399",
          borderRadius: 28,
          fontSize: 74,
          fontWeight: 700,
        }}
      >
        SP
      </div>
    ),
    size
  );
}
