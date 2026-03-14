"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0d0d0f", // Matches bg from theme
          color: "#e4e4e7",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: "32rem",
            padding: "1.5rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(239, 68, 68, 0.5)",
            background: "rgba(239, 68, 68, 0.1)",
            color: "#f87171",
          }}
        >
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem", fontWeight: 600 }}>
            Something went wrong
          </h2>
          <p style={{ margin: "0 0 1rem", fontSize: "0.875rem" }}>
            {process.env.NODE_ENV === "production"
              ? "Something went wrong"
              : error.message}
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              background: "#d97706",
              color: "#0d0d0f",
              border: "none",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
