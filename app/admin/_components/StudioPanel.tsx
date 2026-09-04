"use client";

import { useState } from "react";
import { Rocket, Sprout, Pin } from "lucide-react";

import type { AdminRoom } from "@/actions/admin/rooms";
import type { Category, Charity } from "@/actions/admin/config";
import type { AdminEntity } from "@/actions/admin/roster";
import { deployHouseArena, seedGlobalRoom } from "@/actions/admin/studio";
import { Panel, ActionButton, Field, inputClass, EmptyState, Badge } from "./AdminPrimitives";
import ContenderPicker, { type PickedContender } from "./ContenderPicker";

export default function StudioPanel({
  rooms,
  categories,
  charities,
  roster,
}: {
  rooms: AdminRoom[];
  categories: Category[];
  charities: Charity[];
  roster: AdminEntity[];
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]?.label ?? "Sports");
  const [roomType, setRoomType] = useState<"1v1" | "global">("1v1");
  const [charityId, setCharityId] = useState("");
  const [days, setDays] = useState(7);
  const [featured, setFeatured] = useState(true);
  const [lineup, setLineup] = useState<PickedContender[]>([]);

  const [seedTarget, setSeedTarget] = useState("");
  const [seedLineup, setSeedLineup] = useState<PickedContender[]>([]);

  const parsed = lineup;
  const parsedSeed = seedLineup;

  const globalRooms = rooms.filter((r) => r.room_type === "global");
  const chosenCharity = charities.find((c) => c.id === charityId);

  const countOk =
    roomType === "1v1" ? parsed.length === 2 : parsed.length >= 2 && parsed.length <= 100;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* ------------------------------------------------- GOD-MODE DEPLOY */}
      <Panel
        title="God-mode deployer"
        subtitle="Create an arena instantly — no checkout, no creator commission."
      >
        <div className="flex flex-col gap-4">
          <Field label="Arena title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The GOAT Battle"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
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

            <Field label="Runs for (days)">
              <input
                type="number"
                min={1}
                max={90}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Charity">
            <select
              value={charityId}
              onChange={(e) => setCharityId(e.target.value)}
              className={inputClass}
            >
              <option value="">House Arena (no charity)</option>
              {charities
                .filter((c) => c.is_active)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </Field>

          <div>
            <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/50">
              Format
            </span>
            <div className="mt-1.5 flex gap-2">
              {(["1v1", "global"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setRoomType(t)}
                  className={`pressable flex-1 cut-corner border py-2 font-arcade text-[10px] font-bold
                    uppercase tracking-widest transition-colors ${
                      roomType === t
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-border text-foreground/50 hover:text-foreground"
                    }`}
                >
                  {t === "1v1" ? "1 v 1" : "Global list"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/50 block mb-2">
              {roomType === "1v1" ? "Contenders — exactly 2" : "Contenders — 2 to 100"}
            </span>
            <ContenderPicker
              roster={roster}
              picked={lineup}
              onChange={setLineup}
              max={roomType === "1v1" ? 2 : 100}
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
            <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/70 inline-flex items-center gap-1.5">
              <Pin className="w-3 h-3" /> Pin to homepage carousel
            </span>
          </label>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/40">
              {parsed.length} contender{parsed.length === 1 ? "" : "s"} parsed
              {!countOk && parsed.length > 0 && (
                <span className="text-battle-red">
                  {" "}
                  · {roomType === "1v1" ? "need exactly 2" : "need 2–100"}
                </span>
              )}
            </span>

            <ActionButton
              variant="primary"
              disabled={!title.trim() || !countOk}
              onRun={async () => {
                const res = await deployHouseArena({
                  title,
                  category,
                  roomType,
                  charityId: charityId || undefined,
                  charityName: chosenCharity?.name,
                  durationDays: days,
                  featured,
                  contenders: parsed,
                });
                if (res.ok) {
                  setTitle("");
                  setLineup([]);
                }
                return res;
              }}
            >
              <Rocket className="w-3 h-3" /> Deploy arena
            </ActionButton>
          </div>
        </div>
      </Panel>

      {/* ----------------------------------------------------- BULK SEEDER */}
      <Panel
        title="Bulk seeder"
        subtitle="Drop up to 100 contenders into an existing global arena at once."
      >
        {globalRooms.length === 0 ? (
          <EmptyState message="No global arenas yet — deploy one first" />
        ) : (
          <div className="flex flex-col gap-4">
            <Field label="Target arena">
              <select
                value={seedTarget}
                onChange={(e) => setSeedTarget(e.target.value)}
                className={inputClass}
              >
                <option value="">Select a global arena…</option>
                {globalRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.room_contenders?.length ?? 0} seeded)
                  </option>
                ))}
              </select>
            </Field>

            <ContenderPicker
              roster={roster}
              picked={seedLineup}
              onChange={setSeedLineup}
              max={100}
              category={rooms.find((r) => r.id === seedTarget)?.category}
            />

            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <Badge tone={parsedSeed.length > 100 ? "bad" : "neutral"}>
                  {parsedSeed.length} parsed
                </Badge>
                {parsedSeed.length > 100 && (
                  <span className="text-[10px] text-battle-red font-sans">max 100 per batch</span>
                )}
              </div>

              <ActionButton
                variant="primary"
                disabled={!seedTarget || parsedSeed.length === 0 || parsedSeed.length > 100}
                onRun={async () => {
                  const res = await seedGlobalRoom(seedTarget, parsedSeed);
                  if (res.ok) setSeedLineup([]);
                  return res;
                }}
              >
                <Sprout className="w-3 h-3" /> Seed arena
              </ActionButton>
            </div>

            {parsedSeed.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-hide">
                {parsedSeed.slice(0, 60).map((c, i) => (
                  <span
                    key={`${c.name}-${i}`}
                    className="cut-corner border border-border px-2 py-0.5 text-[10px] font-sans text-foreground/60"
                    style={c.color ? { borderColor: `${c.color}66`, color: c.color } : undefined}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
