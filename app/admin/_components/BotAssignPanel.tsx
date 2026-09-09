"use client";

import { useEffect, useState } from "react";
import { Bot, Coins, Info, Shuffle } from "lucide-react";

import type { DemoRoomRow, BotRow, DemoContenderOption } from "@/actions/admin/demo";
import { assignBotsToArena, listDemoContenders } from "@/actions/admin/demo";
import Avatar from "@/components/ui/Avatar";
import { Panel, ActionButton, Badge, EmptyState, Field, inputClass, money } from "./AdminPrimitives";

type Draft = { contenderId: string; amount: string; message: string };

/**
 * Stage an arena by hand: pick the bots, pick the side each one backs, set the
 * price each one pledges.
 *
 * The "+5 cries" helper randomises bot, side and amount, which fills a room but
 * can't produce a specific standing. This places exactly the result you want —
 * five bots at five different prices, split across contenders however you like.
 */
export default function BotAssignPanel({
  rooms,
  bots,
}: {
  rooms: DemoRoomRow[];
  bots: BotRow[];
}) {
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [contenders, setContenders] = useState<DemoContenderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [note, setNote] = useState<string | null>(null);

  const room = rooms.find((r) => r.id === roomId);

  // Contenders belong to the chosen arena, so the picker refills on every
  // change — and any half-built selection for the old arena is dropped rather
  // than pointing at contender ids that are no longer valid.
  useEffect(() => {
    if (!roomId) return;

    let live = true;

    listDemoContenders(roomId)
      .then((rows) => {
        if (live) setContenders(rows);
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
    };
  }, [roomId]);

  const selected = Object.entries(drafts);
  const staged = selected.reduce((sum, [, d]) => sum + (Number(d.amount) || 0), 0);

  const toggle = (botId: string) => {
    setNote(null);
    setDrafts((prev) => {
      const next = { ...prev };
      if (next[botId]) delete next[botId];
      else
        next[botId] = {
          contenderId: contenders[0]?.contenderId ?? "",
          amount: "25",
          message: "",
        };
      return next;
    });
  };

  const set = (botId: string, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [botId]: { ...prev[botId], ...patch } }));

  /** Deal the selected bots across the contenders so a race isn't one-sided. */
  const spread = () =>
    setDrafts((prev) => {
      const next: Record<string, Draft> = {};
      Object.keys(prev).forEach((botId, i) => {
        next[botId] = {
          ...prev[botId],
          contenderId: contenders[i % contenders.length]?.contenderId ?? "",
        };
      });
      return next;
    });

  const ready =
    !!roomId &&
    selected.length > 0 &&
    selected.every(([, d]) => d.contenderId && Number(d.amount) > 0);

  return (
    <Panel
      title="Assign bots to an arena"
      subtitle="Choose the bots, the side each backs and the exact price each pledges."
      action={
        selected.length > 0 ? (
          <Badge tone="hot">
            {selected.length} selected · {money(staged)}
          </Badge>
        ) : undefined
      }
    >
      {rooms.length === 0 ? (
        <EmptyState message="No demo arenas yet. Create one above" />
      ) : (
        <div className="flex flex-col gap-4">
          <Field label="Arena">
            <select
              value={roomId}
              onChange={(e) => {
                // Contender ids belong to one arena, so a half-built selection
                // can't survive the switch.
                setRoomId(e.target.value);
                setContenders([]);
                setDrafts({});
                setNote(null);
                setLoading(true);
              }}
              className={inputClass}
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} · {r.room_type} · {money(r.total_pool)}
                </option>
              ))}
            </select>
          </Field>

          {loading ? (
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Loading contenders…
            </p>
          ) : contenders.length === 0 ? (
            <p className="text-[11px] text-muted-foreground font-sans">
              That arena has no contenders yet. Add some from its detail page first.
            </p>
          ) : bots.length === 0 ? (
            <EmptyState message="No bots yet. They are created with your first demo arena" />
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Bots
                </span>
                {selected.length > 1 && (
                  <button
                    type="button"
                    onClick={spread}
                    className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase
                               tracking-wider text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <Shuffle className="w-3 h-3" /> Spread across contenders
                  </button>
                )}
              </div>

              <ul className="flex flex-col gap-2">
                {bots.map((b) => {
                  const draft = drafts[b.id];
                  const on = !!draft;

                  return (
                    <li
                      key={b.id}
                      className={`flex flex-col gap-3 p-3 border rounded-xl transition-colors ${
                        on ? "bg-primary/5 border-primary/40" : "bg-muted/30 border-border/60"
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(b.id)}
                          className="accent-[var(--primary)] w-4 h-4 shrink-0"
                        />
                        <Avatar src={b.avatar_url} name={b.username ?? "Bot"} size={32} />
                        <span className="font-mono text-xs font-bold text-foreground truncate">
                          {b.username ?? "Bot"}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground ml-auto shrink-0">
                          {b.cries} cries
                        </span>
                      </label>

                      {on && (
                        <div className="flex flex-col gap-2 pl-0 sm:pl-7">
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-2">
                            <select
                              value={draft.contenderId}
                              onChange={(e) => set(b.id, { contenderId: e.target.value })}
                              aria-label={`Contender for ${b.username ?? "bot"}`}
                              className={inputClass}
                            >
                              {contenders.map((c) => (
                                <option key={c.contenderId} value={c.contenderId}>
                                  {c.name}
                                </option>
                              ))}
                            </select>

                            <div className="relative">
                              <Coins className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                              <input
                                type="number"
                                min={1}
                                step={1}
                                value={draft.amount}
                                onChange={(e) => set(b.id, { amount: e.target.value })}
                                aria-label={`Amount for ${b.username ?? "bot"}`}
                                className={`${inputClass} pl-8 tabular-nums`}
                              />
                            </div>
                          </div>

                          <input
                            value={draft.message}
                            onChange={(e) => set(b.id, { message: e.target.value })}
                            placeholder="Battle cry (optional)"
                            aria-label={`Battle cry for ${b.username ?? "bot"}`}
                            maxLength={150}
                            className={inputClass}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {selected.length
                    ? `${money(staged)} across ${selected.length} pledge${selected.length === 1 ? "" : "s"}`
                    : "Select bots to stage pledges"}
                </span>

                <ActionButton
                  variant="primary"
                  disabled={!ready}
                  onRun={async () => {
                    const res = await assignBotsToArena({
                      roomId,
                      assignments: selected.map(([botId, d]) => ({
                        botId,
                        contenderId: d.contenderId,
                        amount: Number(d.amount),
                        message: d.message || undefined,
                      })),
                    });

                    if (res.ok) {
                      setNote(
                        `${res.data.placed} pledge(s) placed · ${money(res.data.total)} added to ${room?.title ?? "the arena"}`
                      );
                      setDrafts({});
                    }
                    return res.ok ? { ok: true } : res;
                  }}
                >
                  <Bot className="w-3 h-3" /> Place pledges
                </ActionButton>
              </div>

              {note && (
                <p role="status" className="text-[11px] text-emerald-500 font-sans">
                  {note}
                </p>
              )}

              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground font-sans">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Pledges land as ordinary votes flagged demo, so the arena&apos;s pool, the
                  contender&apos;s standing and the bot&apos;s profile all move exactly as a real
                  pledge would, while staying out of the treasury and charity ledger. Only demo
                  arenas accept them.
                </span>
              </p>
            </>
          )}
        </div>
      )}
    </Panel>
  );
}
