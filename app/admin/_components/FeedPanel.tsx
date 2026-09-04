"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bomb, Undo2, Gavel, ShieldCheck, ShieldOff, Search, ArrowLeft,
  MessageSquare, ExternalLink, Swords,
} from "lucide-react";

import type { AdminVote, AdminProfile } from "@/actions/admin/moderation";
import { nukeMessage, setUserBanned, setUserAdmin } from "@/actions/admin/moderation";
import type { AdminRoom } from "@/actions/admin/rooms";
import { Panel, ActionButton, Badge, EmptyState, inputClass, money } from "./AdminPrimitives";
import { formatSince } from "@/lib/time";

/**
 * Moderation, organised by room.
 *
 * The previous version dumped every message on the platform into one flat
 * list, which does not scale past a handful of arenas and gives no sense of
 * where a problem is. You now pick the room, see its volume at a glance, then
 * work its messages.
 */
export default function FeedPanel({
  votes,
  profiles,
  rooms,
}: {
  votes: AdminVote[];
  profiles: AdminProfile[];
  rooms: AdminRoom[];
}) {
  const [view, setView] = useState<"rooms" | "users">("rooms");
  const [openRoom, setOpenRoom] = useState<string | null>(null);
  const [roomQuery, setRoomQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [reason, setReason] = useState<Record<string, string>>({});
  const [hideNuked, setHideNuked] = useState(false);

  // Group messages by room so each row can show real counts.
  const byRoom = useMemo(() => {
    const map = new Map<string, AdminVote[]>();
    for (const v of votes) {
      if (!v.message?.trim()) continue;
      const list = map.get(v.room_id) ?? [];
      list.push(v);
      map.set(v.room_id, list);
    }
    return map;
  }, [votes]);

  const roomRows = useMemo(
    () =>
      rooms
        .map((r) => ({
          room: r,
          messages: byRoom.get(r.id) ?? [],
        }))
        .filter((row) => row.messages.length > 0)
        .filter((row) =>
          row.room.title.toLowerCase().includes(roomQuery.trim().toLowerCase())
        )
        .sort((a, b) => b.messages.length - a.messages.length),
    [rooms, byRoom, roomQuery]
  );

  const activeRoom = rooms.find((r) => r.id === openRoom);
  const activeMessages = (openRoom ? byRoom.get(openRoom) ?? [] : []).filter((m) =>
    hideNuked ? !m.message_hidden : true
  );

  const users = profiles.filter((p) =>
    (p.username ?? "").toLowerCase().includes(userQuery.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* View switch */}
      <div className="flex gap-2">
        {(["rooms", "users"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              setView(v);
              setOpenRoom(null);
            }}
            className={`pressable cut-corner border px-4 py-2 font-arcade text-[10px] font-bold
              uppercase tracking-widest transition-colors ${
                view === v
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-card border-border text-foreground/55 hover:text-foreground"
              }`}
          >
            {v === "rooms" ? "By arena" : "User jail"}
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------- ROOM LIST */}
      {view === "rooms" && !openRoom && (
        <Panel
          title="Arenas with messages"
          subtitle="Pick an arena to review and moderate its battle cries."
          action={
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30" />
              <input
                value={roomQuery}
                onChange={(e) => setRoomQuery(e.target.value)}
                placeholder="Search arenas"
                aria-label="Search arenas"
                className={`${inputClass} pl-8 w-44`}
              />
            </div>
          }
        >
          {roomRows.length === 0 ? (
            <EmptyState message="No arena has paid messages yet" />
          ) : (
            <ul className="flex flex-col gap-2">
              {roomRows.map(({ room, messages }) => {
                const nuked = messages.filter((m) => m.message_hidden).length;

                return (
                  <li key={room.id}>
                    <button
                      type="button"
                      onClick={() => setOpenRoom(room.id)}
                      className="pressable w-full flex items-center justify-between gap-3 p-3
                                 bg-background border border-border cut-corner text-left
                                 hover:border-primary/50 transition-colors group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Swords className="w-3.5 h-3.5 text-foreground/30 shrink-0" />
                          <span className="font-arcade text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {room.title}
                          </span>
                          <Badge tone={room.status === "active" ? "good" : "neutral"}>
                            {room.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-foreground/40 font-sans">
                          {messages.length} message{messages.length === 1 ? "" : "s"}
                          {nuked > 0 && ` · ${nuked} nuked`} · {money(room.total_pool)} pool
                        </span>
                      </div>

                      <MessageSquare className="w-4 h-4 text-foreground/25 group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      )}

      {/* ------------------------------------------------- ROOM MESSAGES */}
      {view === "rooms" && openRoom && activeRoom && (
        <Panel
          title={activeRoom.title}
          subtitle="Nuking hides the words and keeps the money — the pool is never touched."
          action={
            <div className="flex flex-wrap items-center gap-2">
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

              <Link
                href={`/${activeRoom.room_type === "global" ? "global" : "battle"}/${activeRoom.id}`}
                target="_blank"
                className="pressable cut-corner border border-border bg-background px-3 py-1.5
                           font-arcade text-[10px] font-bold uppercase tracking-widest
                           text-foreground/60 hover:text-primary inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3 h-3" /> Open
              </Link>

              <button
                type="button"
                onClick={() => setOpenRoom(null)}
                className="pressable cut-corner border border-border bg-background px-3 py-1.5
                           font-arcade text-[10px] font-bold uppercase tracking-widest
                           text-foreground/60 hover:text-foreground inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
            </div>
          }
        >
          {activeMessages.length === 0 ? (
            <EmptyState message="Nothing to moderate here" />
          ) : (
            <ul className="flex flex-col gap-2 max-h-[600px] overflow-y-auto scrollbar-hide">
              {activeMessages.map((vote) => (
                <li
                  key={vote.id}
                  className={`flex gap-3 p-3 border cut-corner transition-colors ${
                    vote.message_hidden
                      ? "border-battle-red/30 bg-battle-red/5"
                      : "border-border bg-background"
                  }`}
                >
                  <div className="relative w-9 h-9 shrink-0 bg-card border border-border cut-corner overflow-hidden">
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
                      <span className="text-[10px] text-foreground/35 font-sans ml-auto">
                        {formatSince(vote.created_at)}
                      </span>
                    </div>

                    <p
                      className={`mt-1 text-xs font-sans leading-relaxed break-words ${
                        vote.message_hidden ? "text-foreground/30 line-through" : "text-foreground/75"
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
      )}

      {/* ------------------------------------------------------ USER JAIL */}
      {view === "users" && (
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
                className={`${inputClass} pl-8 w-44`}
              />
            </div>
          }
        >
          {users.length === 0 ? (
            <EmptyState message="No users match" />
          ) : (
            <ul className="flex flex-col gap-2 max-h-[560px] overflow-y-auto scrollbar-hide">
              {users.map((user) => (
                <li
                  key={user.id}
                  className="flex flex-wrap items-center gap-3 p-3 border border-border bg-background cut-corner"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/u/${user.id}`}
                        target="_blank"
                        className="font-arcade text-[11px] font-bold text-foreground hover:text-primary transition-colors truncate"
                      >
                        {user.username ?? "unnamed"}
                      </Link>
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
                        className={`${inputClass} w-32`}
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
                      <><ShieldOff className="w-3 h-3" /> Revoke admin</>
                    ) : (
                      <><ShieldCheck className="w-3 h-3" /> Make admin</>
                    )}
                  </ActionButton>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
}
