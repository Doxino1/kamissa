import { ImageResponse } from "next/og";
import { getPublicEvent, publicEventDates } from "@/lib/public-event";

export const alt = "Kamissa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Polices de la direction Racines, demandées à Google Fonts au format TTF
// (sans User-Agent, l'API renvoie du TTF, que le moteur d'image sait lire).
// En cas d'échec, l'image sort avec la police par défaut.
async function loadFont(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getPublicEvent(id);

  const title = event?.titre ?? "Kamissa";
  const meta = event ? [publicEventDates(event), event.lieu ?? event.ville].join(" · ") : "";
  const city = event ? `( ${event.ville} )` : "";
  const titleSize = title.length > 90 ? 60 : title.length > 55 ? 72 : 88;

  const [serif, sans] = await Promise.all([
    loadFont("Instrument+Serif", title),
    loadFont("Hanken+Grotesk:wght@500", `KAMISSA${city}${meta}`),
  ]);
  const fonts = [
    ...(serif ? [{ name: "Serif", data: serif, weight: 400 as const, style: "normal" as const }] : []),
    ...(sans ? [{ name: "Sans", data: sans, weight: 500 as const, style: "normal" as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fdfcf9",
          color: "#12110e",
          padding: "64px 72px",
          fontFamily: "Sans",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 26,
            letterSpacing: "0.14em",
            borderBottom: "2px solid #12110e",
            paddingBottom: 20,
          }}
        >
          <span>KAMISSA</span>
          <span style={{ color: "#6e6a61" }}>{city}</span>
        </div>
        <div style={{ display: "flex", fontFamily: "Serif", fontSize: titleSize, lineHeight: 1.02 }}>{title}</div>
        <div style={{ display: "flex", fontSize: 30, color: "#6e6a61", borderTop: "1px solid #e4dfd4", paddingTop: 22 }}>
          {meta}
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
