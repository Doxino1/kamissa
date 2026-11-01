"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/context";
import { CommunityChatTab } from "@/components/community/CommunityChatTab";
import { ArtistesTab } from "@/components/community/ArtistesTab";
import { MatchingTab } from "@/components/community/MatchingTab";
import { PageHeader, serifTabClass, tabLabelClass, TAB_NUMBER, tabNumber } from "@/components/PageHeader";

type Tab = "communaute" | "artistes" | "matching";

export default function CommunautePage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("communaute");

  const tabs: [Tab, string][] = [
    ["communaute", t.nav.communaute],
    ["artistes", t.artiste.directory],
    ["matching", t.nav.matching],
  ];

  return (
    <div className="pb-12">
      <PageHeader title={t.nav.communaute} bordered={false} />

      <div
        role="tablist"
        className="mx-auto mt-2 flex max-w-[1360px] flex-wrap gap-x-10 gap-y-2 border-b border-t border-b-border border-t-foreground px-4 py-[18px] md:px-10"
      >
        {tabs.map(([value, label], i) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={serifTabClass(tab === value)}
          >
            <span className={TAB_NUMBER}>{tabNumber(i + 1)}</span>
            <span className={tabLabelClass(tab === value)}>{label}</span>
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-[1360px] px-4 md:px-10">
        {tab === "communaute" && <CommunityChatTab />}
        {tab === "artistes" && <ArtistesTab />}
        {tab === "matching" && <MatchingTab />}
      </div>
    </div>
  );
}
