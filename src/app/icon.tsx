import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          background: "#0d0d0f", // Matches bg from theme
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#f59e0b", // Matches accent from theme
          borderRadius: 6,
        }}
      >
        I
      </div>
    ),
    { ...size }
  );
}
