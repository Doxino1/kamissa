import { NextResponse } from "next/server";
import { importParisEvents } from "@/lib/import-events";

// Appelée chaque dimanche par le Vercel Cron Job défini dans vercel.json, avant
// l'email hebdomadaire du lundi. Refuse tout appel si CRON_SECRET n'est pas
// configuré : cette route écrit en base.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs: string[] = [];
  try {
    const result = await importParisEvents({ dryRun: false, onLog: (line) => logs.push(line) });
    return NextResponse.json({ ...result, logs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error", logs },
      { status: 500 }
    );
  }
}
