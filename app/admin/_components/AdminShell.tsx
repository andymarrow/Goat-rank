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
    <div className="w-full min-h-screen flex flex-col lg:flex-row">
      {/* ------------------------------------------------------- SIDEBAR */}
      {/* Fixed rail on desktop, a horizontal rail on smaller screens — a
          vertical sidebar on a phone would eat most of the viewport. */}
      <aside
        className="lg:w-60 lg:shrink-0 lg:h-screen lg:sticky lg:top-0 border-b lg:border-b-0
                   lg:border-r border-border bg-card flex flex-col"
      >
        <div className="corner-ticks relative px-4 py-4 lg:py-6 border-b border-border overflow-hidden">
          <div className="tex-grid absolute inset-0 pointer-events-none" />
          <div className="relative flex items-center gap-2 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-arcade text-[9px] uppercase tracking-[0.2em] text-foreground/50">
              Restricted
            </span>
          </div>
          <h1 className="relative font-arcade font-black uppercase tracking-wider text-xl lg:text-2xl text-foreground">
            GOD<span className="text-primary italic"> MODE</span>
          </h1>
          <p className="relative mt-0.5 text-[11px] text-foreground/45 font-sans truncate">
            {props.adminName}
          </p>
        </div>

        <nav
          aria-label="Admin sections"
          className="flex lg:flex-col gap-1 p-2 overflow-x-auto lg:overflow-x-visible
                     lg:overflow-y-auto scrollbar-hide lg:flex-1"
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
                className={`pressable relative shrink-0 lg:w-full flex items-center gap-2.5 px-3 py-2.5
                  cut-corner font-arcade text-[10px] font-bold uppercase tracking-widest
                  transition-colors text-left ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/55 hover:text-foreground hover:bg-foreground/5"
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{t.label}</span>

                {typeof t.badge === "number" && t.badge > 0 && (
                  <span
                    className={`ml-auto cut-corner px-1.5 py-0.5 text-[9px] tabular-nums ${
                      active ? "bg-black/25 text-primary-foreground" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="hidden lg:block p-2 border-t border-border">
          <Link
            href="/"
            className="pressable w-full flex items-center gap-2.5 px-3 py-2.5 cut-corner
                       font-arcade text-[10px] font-bold uppercase tracking-widest
                       text-foreground/55 hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Live site
          </Link>
        </div>
      </aside>

      {/* -------------------------------------------------------- PANELS */}
      <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-8 pb-28">
        {tab === "god-eye" && <GodEyePanel overview={props.overview} />}
        {tab === "arenas" && <ArenaPanel rooms={props.rooms} categories={props.categories} />}
        {tab === "studio" && (
          <StudioPanel
            rooms={props.rooms}
            categories={props.categories}
            charities={props.charities}
            roster={props.entities}
          />
        )}
        {tab === "roster" && <RosterPanel entities={props.entities} categories={props.categories} />}
        {tab === "feed" && <FeedPanel votes={props.votes} profiles={props.profiles} rooms={props.rooms} />}
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
