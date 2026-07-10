import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export const alt = "Skopos — boring log infrastructure, smart AI on top";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000000",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 144,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "#ffffff",
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          skopos
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 44,
            fontWeight: 400,
            color: "#e6edf3",
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            maxWidth: 900,
          }}
        >
          <div style={{ display: "flex" }}>Boring log infrastructure.</div>
          <div style={{ display: "flex" }}>Smart AI on top.</div>
        </div>

        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 80,
            left: 80,
            right: 80,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#7d8590",
              fontFamily: "monospace",
            }}
          >
            skopos.ink
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 22,
              color: "#7d8590",
              fontFamily: "monospace",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 14,
                height: 14,
                borderRadius: 7,
                background: "#3fb950",
                marginRight: 12,
              }}
            />
            <div style={{ display: "flex" }}>log.info("ready")</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
