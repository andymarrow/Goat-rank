"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity, Swords, Hammer, Users, MessageSquare, Wallet, Settings,
  ArrowLeft, ShieldCheck, Smile,
} from "lucide-react";

import type { AdminOverview } from "@/actions/admin/analytics";
import type { AdminRoom } from "@/actions/admin/rooms";
import type { AdminEntity } from "@/actions/admin/roster";
import type { AdminVote, AdminProfile } from "@/actions/admin/moderation";
import type { AdminPayout, CharityRow } from "@/actions/admin/payouts";
import type { Category, Charity, SiteBanner } from "@/actions/admin/config";
import type { AdminAvatar } from "@/actions/admin/avatars";

import GodEyePanel from "./GodEyePanel";
import ArenaPanel from "./ArenaPanel";
import StudioPanel from "./StudioPanel";
import RosterPanel from "./RosterPanel";
import FeedPanel from "./FeedPanel";
import LedgerPanel from "./LedgerPanel";
import ConfigPanel from "./ConfigPanel";
import AvatarPanel from "./AvatarPanel";

type Props = {
  adminName: string;
  overview: AdminOverview;
  rooms: AdminRoom[];
  entities: AdminEntity[];
  votes: AdminVote[];
  profiles: AdminProfile[];
  payouts: AdminPayout[];
  charityLedger: CharityRow[];
  categories: Category[];
  charities: Charity[];
  banners: SiteBanner[];
  avatars: AdminAvatar[];
};

export default function AdminShell(props: Props) {
  const [tab, setTab] = useState("god-eye");

  const pendingEntities = props.entities.filter((e) => e.moderation_status === "pending").length;
  const pendingPayouts = props.payouts.filter(
    (p) => p.status === "requested" || p.status === "approved"
  ).length;

  const tabs = [
    { id: "god-eye", label: "God-Eye", icon: Activity },
    { id: "arenas", label: "Arenas", icon: Swords },
    { id: "studio", label: "Studio", icon: Hammer },
    { id: "roster", label: "Roster", icon: Users, badge: pendingEntities },
    { id: "feed", label: "Feed", icon: MessageSquare },
    { id: "ledger", label: "Ledger", icon: Wallet, badge: pendingPayouts },
    { id: "avatars", label: "Avatars", icon: Smile },
    { id: "config", label: "Config", icon: Settings },
  ];

  return (
    <div className="w-full min-h-screen">
      {/* ---------------------------------------------------------- HEADER */}
      <header className="corner-ticks relative border-b border-border bg-card overflow-hidden">
        <div className="tex-grid absolute inset-0 pointer-events-none" />
        <div className="tex-scanlines absolute inset-0 pointer-events-none" />

        <div className="relative max-w-[1600px] mx-auto px-4 md:px-8 py-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="font-arcade text-[10px] uppercase tracking-[0.2em] text-foreground/50">
                Restricted · Command Console
              </span>
            </div>
            <h1 className="font-arcade font-black uppercase tracking-wider text-3xl md:text-5xl text-foreground">
              GOD<span className="text-primary italic"> MODE</span>
            </h1>
            <p className="mt-1 text-xs text-foreground/50 font-sans">
              Signed in as <span className="text-foreground/80">{props.adminName}</span>
            </p>
          </div>

          <Link
            href="/"
            className="pressable cut-corner border border-border bg-background px-4 py-2 font-arcade
                       text-[10px] font-bold uppercase tracking-widest text-foreground/70
                       hover:text-foreground hover:border-foreground/40 transition-colors
                       inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Live site
          </Link>
        </div>

        {/* ------------------------------------------------------------ TABS */}
        <nav
          aria-label="Admin sections"
          className="relative max-w-[1600px] mx-auto px-4 md:px-8 flex gap-1 overflow-x-auto scrollbar-hide"
        >
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={active ? "page" : undefined}
                className={`pressable relative shrink-0 px-4 py-3 font-arcade text-[11px] font-bold
                  uppercase tracking-widest transition-colors inline-flex items-center gap-2
                  ${active ? "text-primary" : "text-foreground/45 hover:text-foreground/80"}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}

                {typeof t.badge === "number" && t.badge > 0 && (
                  <span className="cut-corner bg-primary text-primary-foreground px-1.5 py-0.5 text-[9px] tabular-nums">
                    {t.badge}
                  </span>
                )}

                {active && (
                  <motion.span
                    layoutId="admin-tab-underline"
                    className="absolute inset-x-2 -bottom-px h-0.5 bg-primary"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* ----------------------------------------------------------- PANELS */}
      <main className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 pb-24">
        {tab === "god-eye" && <GodEyePanel overview={props.overview} />}
        {tab === "arenas" && <ArenaPanel rooms={props.rooms} categories={props.categories} />}
        {tab === "studio" && (
          <StudioPanel rooms={props.rooms} categories={props.categories} charities={props.charities} />
        )}
        {tab === "roster" && <RosterPanel entities={props.entities} categories={props.categories} />}
        {tab === "feed" && <FeedPanel votes={props.votes} profiles={props.profiles} />}
        {tab === "ledger" && (
          <LedgerPanel payouts={props.payouts} charityLedger={props.charityLedger} />
        )}
        {tab === "avatars" && <AvatarPanel avatars={props.avatars} />}
        {tab === "config" && (
          <ConfigPanel
            categories={props.categories}
            charities={props.charities}
            banners={props.banners}
          />
        )}
      </main>
    </div>
  );
}
