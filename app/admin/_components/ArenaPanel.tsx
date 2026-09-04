"use client";

import { useState } from "react";
import { Pin, PinOff, Save, Gavel, Trash2, Search, Info } from "lucide-react";
import ContenderStack from "./ContenderStack";

import type { AdminRoom } from "@/actions/admin/rooms";
import { setRoomFeatured, updateRoom, forceSettleRoom, deleteRoom } from "@/actions/admin/rooms";
import type { Category } from "@/actions/admin/config";
import {
  Panel, ActionButton, Badge, EmptyState, Scroller, Field, inputClass, money,
} from "./AdminPrimitives";

const statusTone = (s: string) =>
  s === "active" ? "good" : s === "settled" ? "neutral" : "warn";

export default function ArenaPanel({
  rooms,
  categories,
}: {
  rooms: AdminRoom[];
  categories: Category[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ title: string; category: string }>({
    title: "",
    category: "",
  });

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
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30" />
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
      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-foreground/45 font-sans mb-4">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-foreground/30" />
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
            className={`pressable cut-corner border px-3 py-1 font-arcade text-[10px] font-bold uppercase
              tracking-widest transition-colors ${
                filter === f
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background border-border text-foreground/50 hover:text-foreground"
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
              <tr className="border-b border-border text-left">
                {["Arena", "Type", "Status", "Pool", "Contenders", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="py-2 pr-3 font-arcade text-[9px] uppercase tracking-widest text-foreground/40"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((room) => {
                const isEditing = editing === room.id;
                const names = room.room_contenders
                  ?.map((rc) => rc.entities?.name)
                  .filter(Boolean) as string[];

                return (
                  <tr key={room.id} className="border-b border-border/50 align-top">
                    <td className="py-3 pr-3 max-w-[280px]">
                      {isEditing ? (
                        <div className="flex flex-col gap-2 w-64">
                          <Field label="Title">
                            <input
                              value={draft.title}
                              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                              className={inputClass}
                            />
                          </Field>
                          <Field label="Category">
                            <input
                              list="admin-categories"
                              value={draft.category}
                              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                              className={inputClass}
                            />
                          </Field>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-arcade text-xs font-bold text-foreground truncate">
                              {room.title}
                            </span>
                            {room.is_featured && <Badge tone="hot">Pinned</Badge>}
                          </div>
                          <span className="text-[11px] text-foreground/40 font-sans">
                            {room.category}
                          </span>
                        </>
                      )}
                    </td>

                    <td className="py-3 pr-3">
                      <Badge>{room.room_type}</Badge>
                    </td>

                    <td className="py-3 pr-3">
                      <Badge tone={statusTone(room.status)}>{room.status.replace("_", " ")}</Badge>
                    </td>

                    <td className="py-3 pr-3 font-arcade text-xs tabular-nums text-battle-yellow">
                      {money(room.total_pool)}
                    </td>

                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <ContenderStack contenders={room.room_contenders ?? []} />
                        <span className="text-[11px] text-foreground/45 font-sans max-w-[130px] truncate">
                          {names?.length ? names.join(" vs ") : "—"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3">
                      <div className="flex flex-wrap items-start gap-2">
                        {isEditing ? (
                          <>
                            <ActionButton
                              variant="primary"
                              onRun={() => updateRoom(room.id, draft)}
                              onDone={(ok) => ok && setEditing(null)}
                            >
                              <Save className="w-3 h-3" /> Save
                            </ActionButton>
                            <button
                              type="button"
                              onClick={() => setEditing(null)}
                              className="pressable cut-corner border border-border px-3 py-1.5 font-arcade
                                         text-[10px] uppercase tracking-widest text-foreground/50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
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
                              onClick={() => {
                                setEditing(room.id);
                                setDraft({ title: room.title, category: room.category });
                              }}
                              className="pressable cut-corner border border-border bg-background px-3 py-1.5
                                         font-arcade text-[10px] font-bold uppercase tracking-widest
                                         text-foreground/70 hover:text-foreground transition-colors"
                            >
                              Edit
                            </button>

                            {room.status !== "settled" && (
                              <ActionButton
                                variant="danger"
                                confirm="Settle now?"
                                onRun={() => forceSettleRoom(room.id)}
                              >
                                <Gavel className="w-3 h-3" /> Force settle
                              </ActionButton>
                            )}

                            <ActionButton
                              variant="danger"
                              confirm="Delete?"
                              onRun={() => deleteRoom(room.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </ActionButton>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Scroller>
      )}

      <datalist id="admin-categories">
        {categories.map((c) => (
          <option key={c.id} value={c.label} />
        ))}
      </datalist>
    </Panel>
  );
}
