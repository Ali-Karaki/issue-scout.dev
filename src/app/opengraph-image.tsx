import { ImageResponse } from "next/og";

export const alt = "IssueScout - Find OSS issues that don't appear to have an open PR referencing them";
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
          fontSize: 72,
          fontWeight: 700,
          background: "#0d0d0f",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#e4e4e7",
        }}
      >
        <span>
          Issue<span style={{ color: "#f59e0b" }}>Scout</span>
        </span>
        <span
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: "#71717a",
            marginTop: 16,
          }}
        >
          Find OSS issues that don&apos;t appear to have an open PR referencing them
        </span>
      </div>
    ),
    { ...size }
  );
}
