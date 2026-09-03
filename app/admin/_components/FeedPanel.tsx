"use client";

import { useState } from "react";
import Image from "next/image";
import { Bomb, Undo2, Gavel, ShieldCheck, ShieldOff, Search } from "lucide-react";

import type { AdminVote, AdminProfile } from "@/actions/admin/moderation";
import { nukeMessage, setUserBanned, setUserAdmin } from "@/actions/admin/moderation";
import {
  Panel, ActionButton, Badge, EmptyState, inputClass, money,
} from "./AdminPrimitives";

const since = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function FeedPanel({
  votes,
  profiles,
}: {
  votes: AdminVote[];
  profiles: AdminProfile[];
}) {
  const [hideNuked, setHideNuked] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [reason, setReason] = useState<Record<string, string>>({});

  const withMessages = votes.filter((v) => v.message?.trim());
  const feed = hideNuked ? withMessages.filter((v) => !v.message_hidden) : withMessages;

  const users = profiles.filter((p) =>
    (p.username ?? "").toLowerCase().includes(userQuery.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* ------------------------------------------------------- LIVE FEED */}
      <Panel
        title="Battle cries"
        subtitle="Nuking hides the words and keeps the money — the pool is never touched."
        action={
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hideNuked}
              onChange={(e) => setHideNuked(e.target.checked)}
              className="accent-[var(--primary)] w-4 h-4"
            />
            <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/50">
              Hide nuked
            </span>
          </label>
        }
      >
        {feed.length === 0 ? (
          <EmptyState message="No paid messages yet" />
        ) : (
          <ul className="flex flex-col gap-2 max-h-[560px] overflow-y-auto scrollbar-hide">
            {feed.map((vote) => (
              <li
                key={vote.id}
                className={`relative flex gap-3 p-3 border cut-corner transition-colors ${
                  vote.message_hidden
                    ? "border-battle-red/30 bg-battle-red/5"
                    : "border-border bg-background"
                }`}
              >
                <div className="relative w-9 h-9 shrink-0 bg-black cut-corner border border-border overflow-hidden">
                  {vote.voter_avatar && (
                    <Image
                      src={vote.voter_avatar}
                      alt={vote.voter_name}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-arcade text-[11px] font-bold text-foreground">
                      {vote.voter_name}
                    </span>
                    <Badge tone="hot">{money(vote.amount)}</Badge>
                    {vote.refunded && <Badge tone="bad">Refunded</Badge>}
                    {vote.message_hidden && <Badge tone="bad">Nuked</Badge>}
                    <span className="text-[10px] text-foreground/35 font-sans">
                      {vote.rooms?.title ?? "—"} · {since(vote.created_at)}
                    </span>
                  </div>

                  <p
                    className={`mt-1 text-xs font-sans leading-relaxed break-words ${
                      vote.message_hidden
                        ? "text-foreground/30 line-through"
                        : "text-foreground/75"
                    }`}
                  >
                    {vote.message}
                  </p>
                </div>

                <div className="shrink-0">
                  {vote.message_hidden ? (
                    <ActionButton onRun={() => nukeMessage(vote.id, false)}>
                      <Undo2 className="w-3 h-3" /> Restore
                    </ActionButton>
                  ) : (
                    <ActionButton
                      variant="danger"
                      confirm="Nuke it?"
                      onRun={() => nukeMessage(vote.id, true)}
                    >
                      <Bomb className="w-3 h-3" /> Nuke
                    </ActionButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* ------------------------------------------------------- USER JAIL */}
      <Panel
        title="User jail"
        subtitle="Suspended accounts cannot deploy arenas or withdraw creator funds."
        action={
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30" />
            <input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Search users"
              aria-label="Search users"
              className={`${inputClass} pl-8 w-48`}
            />
          </div>
        }
      >
        {users.length === 0 ? (
          <EmptyState message="No users match" />
        ) : (
          <ul className="flex flex-col gap-2 max-h-[480px] overflow-y-auto scrollbar-hide">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex flex-wrap items-center gap-3 p-3 border border-border bg-background cut-corner"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-arcade text-[11px] font-bold text-foreground truncate">
                      {user.username ?? "unnamed"}
                    </span>
                    {user.is_admin && <Badge tone="hot">Admin</Badge>}
                    {user.is_banned && <Badge tone="bad">Jailed</Badge>}
                  </div>
                  <p className="text-[10px] text-foreground/40 font-sans mt-0.5">
                    Wallet {money(user.wallet_balance)} · earned {money(user.total_earned)}
                    {user.banned_reason && ` · ${user.banned_reason}`}
                  </p>
                </div>

                {user.is_banned ? (
                  <ActionButton onRun={() => setUserBanned(user.id, false)}>
                    <Undo2 className="w-3 h-3" /> Release
                  </ActionButton>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      value={reason[user.id] ?? ""}
                      onChange={(e) => setReason({ ...reason, [user.id]: e.target.value })}
                      placeholder="Reason"
                      aria-label={`Ban reason for ${user.username ?? "user"}`}
                      className={`${inputClass} w-36`}
                    />
                    <ActionButton
                      variant="danger"
                      confirm="Jail?"
                      onRun={() => setUserBanned(user.id, true, reason[user.id])}
                    >
                      <Gavel className="w-3 h-3" /> Jail
                    </ActionButton>
                  </div>
                )}

                <ActionButton
                  confirm={user.is_admin ? "Revoke?" : "Promote?"}
                  onRun={() => setUserAdmin(user.id, !user.is_admin)}
                >
                  {user.is_admin ? (
                    <><ShieldOff className="w-3 h-3" /> Revoke</>
                  ) : (
                    <><ShieldCheck className="w-3 h-3" /> Make admin</>
                  )}
                </ActionButton>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
