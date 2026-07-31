"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/context";
import { CommunityChatTab } from "@/components/community/CommunityChatTab";
import { ArtistesTab } from "@/components/community/ArtistesTab";
import { MatchingTab } from "@/components/community/MatchingTab";

type Tab = "communaute" | "artistes" | "matching";

function tabClass(active: boolean) {
  return `rounded-full border px-5 py-2.5 text-sm font-bold transition ${
    active
      ? "border-transparent bg-accent text-accent-foreground"
      : "border-border bg-transparent text-foreground"
  }`;
}

export default function CommunautePage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("communaute");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:max-w-none md:px-6 md:py-4">
      <div className="mb-6 flex gap-2">
        <button onClick={() => setTab("communaute")} className={tabClass(tab === "communaute")}>
          {t.nav.communaute}
        </button>
        <button onClick={() => setTab("artistes")} className={tabClass(tab === "artistes")}>
          {t.artiste.directory}
        </button>
        <button onClick={() => setTab("matching")} className={tabClass(tab === "matching")}>
          {t.nav.matching}
        </button>
      </div>

      {tab === "communaute" && <CommunityChatTab />}
      {tab === "artistes" && <ArtistesTab />}
      {tab === "matching" && <MatchingTab />}
    </div>
  );
}
