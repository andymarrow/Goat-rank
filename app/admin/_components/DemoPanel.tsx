"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Plus, Trash2, MessageSquarePlus, ExternalLink, Pin, Info } from "lucide-react";

import type { DemoRoomRow } from "@/actions/admin/demo";
import { createDemoRoom, deleteDemoRoom, addDemoCries } from "@/actions/admin/demo";
import { setRoomFeatured } from "@/actions/admin/rooms";
import type { AdminEntity } from "@/actions/admin/roster";
import type { Category } from "@/actions/admin/config";
import ContenderPicker, { type PickedContender } from "./ContenderPicker";
import { Panel, ActionButton, Badge, EmptyState, Field, inputClass, money } from "./AdminPrimitives";
import { formatSince } from "@/lib/time";

/**
 * Demo arenas.
 *
 * These are ordinary rows flagged is_demo, not fixtures in a constants file —
 * so they have real detail pages, appear in the feed, and can be edited from
 * the Arenas and Roster panels like anything else. This panel is where they
 * are created, topped up with bot activity, and removed.
 */
export default function DemoPanel({
  rooms,
  roster,
  categories,
}: {
  rooms: DemoRoomRow[];
  roster: AdminEntity[];
  categories: Category[];
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]?.label ?? "Sports");
  const [roomType, setRoomType] = useState<"1v1" | "global">("1v1");
  const [lineup, setLineup] = useState<PickedContender[]>([]);
  const [cries, setCries] = useState(8);
  const [featured, setFeatured] = useState(true);

  const countOk = roomType === "1v1" ? lineup.length === 2 : lineup.length >= 2;

  return (
    <div className="flex flex-col gap-6">
      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground font-sans">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Demo arenas exist so the platform doesn&apos;t look empty. Every bot supporter is marked
          with an orange dot in the feed, and demo pledges are excluded from the treasury, the
          charity ledger and user counts — so they can never be mistaken for revenue. They are real
          rows, so they have working detail pages and are editable from{" "}
          <Link href="/admin/arenas" className="text-primary hover:underline">
            Arenas
          </Link>{" "}
          and{" "}
          <Link href="/admin/roster" className="text-primary hover:underline">
            Roster
          </Link>
          .
        </span>
      </p>

      {/* ------------------------------------------------------- CREATE */}
      <Panel title="New demo arena" subtitle="Seeded contest with disclosed bot supporters.">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ronaldo vs Messi: Ultimate GOAT"
                className={inputClass}
              />
            </Field>

            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
                Format
              </span>
              <div className="flex gap-2">
                {(["1v1", "global"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRoomType(t)}
                    className={`flex-1 rounded-xl border py-2 font-mono text-[10px] font-bold uppercase
                      tracking-wider transition-colors cursor-pointer ${
                        roomType === t
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-muted/30 border-border/60 text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {t === "1v1" ? "1 v 1" : "Global"}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Bot battle cries">
              <input
                type="number"
                min={0}
                max={40}
                value={cries}
                onChange={(e) => setCries(Number(e.target.value))}
                className={inputClass}
              />
            </Field>
          </div>

          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">
              {roomType === "1v1" ? "Contenders — exactly 2" : "Contenders — 2 or more"}
            </span>
            <ContenderPicker
              roster={roster}
              picked={lineup}
              onChange={setLineup}
              max={roomType === "1v1" ? 2 : 50}
              category={category}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="accent-[var(--primary)] w-4 h-4"
            />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
              <Pin className="w-3 h-3" /> Pin to homepage
            </span>
          </label>

          <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {lineup.length} contender{lineup.length === 1 ? "" : "s"}
              {!countOk && lineup.length > 0 && (
                <span className="text-red-500">
                  {" "}
                  · {roomType === "1v1" ? "need exactly 2" : "need 2+"}
                </span>
              )}
            </span>

            <ActionButton
              variant="primary"
              disabled={!title.trim() || !countOk}
              onRun={async () => {
                const res = await createDemoRoom({
                  title,
                  category,
                  roomType,
                  contenders: lineup.map((c) => ({
                    name: c.name,
                    image: c.image,
                    color: c.color,
                  })),
                  cries,
                  featured,
                });
                if (res.ok) {
                  setTitle("");
                  setLineup([]);
                }
                return res;
              }}
            >
              <Plus className="w-3 h-3" /> Create demo arena
            </ActionButton>
          </div>
        </div>
      </Panel>

      {/* --------------------------------------------------------- LIST */}
      <Panel
        title="Demo arenas"
        subtitle="Live on the homepage, marked as demo throughout."
        action={<Badge tone="hot">{rooms.length} seeded</Badge>}
      >
        {rooms.length === 0 ? (
          <EmptyState message="No demo arenas — create one above" />
        ) : (
          <ul className="flex flex-col gap-2">
            {rooms.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 border border-border/60 rounded-xl"
              >
                <Bot className="w-4 h-4 text-primary shrink-0" />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground truncate">
                      {r.title}
                    </span>
                    <Badge>{r.room_type}</Badge>
                    {r.is_featured && <Badge tone="hot">Pinned</Badge>}
                  </div>
                  <span className="text-[11px] text-muted-foreground font-sans">
                    {r.category} · {money(r.total_pool)} seeded pool · {r.cries} bot cries ·{" "}
                    {formatSince(r.created_at)}
                  </span>
                </div>

                <div className="flex flex-wrap items-start gap-2">
                  <Link
                    href={`/${r.room_type === "global" ? "global" : "battle"}/${r.id}`}
                    target="_blank"
                    className="rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 font-mono
                               text-[10px] font-bold uppercase tracking-wider text-muted-foreground
                               hover:text-primary transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" /> Open
                  </Link>

                  <ActionButton onRun={() => addDemoCries(r.id, 5)}>
                    <MessageSquarePlus className="w-3 h-3" /> +5 cries
                  </ActionButton>

                  <ActionButton onRun={() => setRoomFeatured(r.id, !r.is_featured)}>
                    <Pin className="w-3 h-3" /> {r.is_featured ? "Unpin" : "Pin"}
                  </ActionButton>

                  <ActionButton variant="danger" confirm="Delete?" onRun={() => deleteDemoRoom(r.id)}>
                    <Trash2 className="w-3 h-3" />
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
