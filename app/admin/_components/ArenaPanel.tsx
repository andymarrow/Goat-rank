"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Pin, PinOff, Gavel, Trash2, Search, Info, Users, ChevronDown, Pencil } from "lucide-react";
import ContenderStack from "./ContenderStack";
import ContenderEditor from "./ContenderEditor";

import type { AdminRoom } from "@/actions/admin/rooms";
import { setRoomFeatured, forceSettleRoom, deleteRoom } from "@/actions/admin/rooms";
import {
  Panel, ActionButton, Badge, ConfirmDialog, EmptyState, Scroller, inputClass, money,
} from "./AdminPrimitives";

const statusTone = (s: string) =>
  s === "active" ? "good" : s === "settled" ? "neutral" : "warn";

export default function ArenaPanel({ rooms }: { rooms: AdminRoom[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [openContenders, setOpenContenders] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminRoom | null>(null);

  const visible = rooms.filter((r) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "featured" ? r.is_featured : r.status === filter);
    const matchesQuery = r.title.toLowerCase().includes(query.trim().toLowerCase());
    return matchesFilter && matchesQuery;
  });

  const filters = ["all", "active", "pending_payment", "settled", "featured"];

  return (
    <Panel
      title="Arena command"
      subtitle={`${rooms.length} arenas. Pin to the homepage carousel, fix titles, or close one early.`}
      action={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search arenas"
              aria-label="Search arenas"
              className={`${inputClass} pl-8 w-48`}
            />
          </div>
        </div>
      }
    >
      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground font-sans mb-4">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
        <span>
          <strong className="text-foreground/70">Force settle</strong> ends an arena immediately:
          it stops accepting votes, unpins it from the homepage and stamps who closed it. It moves
          no money — the creator&apos;s 10% was already paid per-vote as each vote landed, so
          paying again here would double-pay them. Use it when a timer is wrong or an arena has to
          stop now. <strong className="text-foreground/70">Delete</strong> only works on arenas
          that never took a payment.
        </span>
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`pressable rounded-xl border px-3 py-1 font-mono text-[10px] font-bold uppercase
              tracking-widest transition-colors ${
                filter === f
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background border-border/60 text-muted-foreground hover:text-foreground"
              }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState message="No arenas match" />
      ) : (
        <Scroller>
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-left">
                {["Arena", "Type", "Status", "Pool", "Contenders", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="py-2 pr-3 font-mono text-[9px] uppercase tracking-widest text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((room) => {
                const names = room.room_contenders
                  ?.map((rc) => rc.entities?.name)
                  .filter(Boolean) as string[];

                return (
                  <Fragment key={room.id}>
                  <tr className="border-b border-border/50 align-top">
                    <td className="py-3 pr-3 max-w-[280px]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-foreground truncate">
                              {room.title}
                            </span>
                            {room.is_featured && <Badge tone="hot">Pinned</Badge>}
                          </div>
                          <span className="text-[11px] text-muted-foreground font-sans">
                            {room.category}
                          </span>
                    </td>

                    <td className="py-3 pr-3">
                      <Badge>{room.room_type}</Badge>
                    </td>

                    <td className="py-3 pr-3">
                      <Badge tone={statusTone(room.status)}>{room.status.replace("_", " ")}</Badge>
                    </td>

                    <td className="py-3 pr-3 font-mono text-xs tabular-nums text-amber-500">
                      {money(room.total_pool)}
                    </td>

                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <ContenderStack contenders={room.room_contenders ?? []} />
                        <span className="text-[11px] text-muted-foreground font-sans max-w-[130px] truncate">
                          {names?.length ? names.join(" vs ") : "—"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3">
                      <div className="flex flex-wrap items-start gap-2">
                            <ActionButton
                              onRun={() => setRoomFeatured(room.id, !room.is_featured)}
                              variant={room.is_featured ? "ghost" : "primary"}
                            >
                              {room.is_featured ? (
                                <><PinOff className="w-3 h-3" /> Unpin</>
                              ) : (
                                <><Pin className="w-3 h-3" /> Feature</>
                              )}
                            </ActionButton>

                            <button
                              type="button"
                              onClick={() =>
                                setOpenContenders(openContenders === room.id ? null : room.id)
                              }
                              className="rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5
                                         font-mono text-[10px] font-bold uppercase tracking-wider
                                         text-muted-foreground hover:text-foreground transition-colors
                                         cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Users className="w-3 h-3" /> Contenders
                              <ChevronDown
                                className={`w-3 h-3 transition-transform ${
                                  openContenders === room.id ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            <Link
                              href={`/admin/arenas/${room.id}`}
                              className="rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5
                                         font-mono text-[10px] font-bold uppercase tracking-wider
                                         text-muted-foreground hover:text-primary transition-colors
                                         cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </Link>

                            {room.status !== "settled" && (
                              <ActionButton
                                variant="danger"
                                confirm="Settle now?"
                                onRun={() => forceSettleRoom(room.id)}
                              >
                                <Gavel className="w-3 h-3" /> Force settle
                              </ActionButton>
                            )}

                            <button
                              type="button"
                              onClick={() => setPendingDelete(room)}
                              aria-label={`Delete ${room.title}`}
                              className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5
                                         font-mono text-[10px] font-bold uppercase tracking-wider
                                         text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer
                                         inline-flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                      </div>
                    </td>
                  </tr>

                  {openContenders === room.id && (
                    <tr key={`${room.id}-contenders`} className="border-b border-border/60">
                      <td colSpan={6} className="py-3 pr-3">
                        <ContenderEditor contenders={room.room_contenders ?? []} roomId={room.id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </Scroller>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title={pendingDelete ? `Delete "${pendingDelete.title}"?` : "Delete arena?"}
        confirmLabel="Delete arena"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => deleteRoom(pendingDelete!.id, { force: true })}
      >
        <p>
          The arena, its contender line-up and its page all disappear. Anyone holding a link to it
          gets a 404.
        </p>

        {Number(pendingDelete?.total_pool) > 0 && (
          <p>
            It holds{" "}
            <strong className="text-foreground">{money(pendingDelete?.total_pool ?? 0)}</strong>.
            Deleting destroys the pledge records — the only account of who paid what — while the
            money they moved stays moved: the creator&apos;s 10% was credited per pledge as it
            landed, and each contender&apos;s lifetime total still counts it. Nothing here reverses
            that.
          </p>
        )}

        <p>This cannot be undone.</p>
      </ConfirmDialog>
    </Panel>
  );
}
