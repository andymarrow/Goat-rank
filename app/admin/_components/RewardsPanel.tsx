"use client";

import { useState } from "react";
import Link from "next/link";
import { Coins, Gift, Trophy, Save, RefreshCw, Plus, Info, Flame } from "lucide-react";

import type {
  AdminAchievement, AdminReward, Earner, RateRow,
} from "@/actions/admin/rewards";
import {
  setPointRate, upsertRewardItem, setRewardActive, updateAchievement, grantPoints,
  backfillAchievements,
} from "@/actions/admin/rewards";
import LevelBadge from "@/components/ui/LevelBadge";
import {
  Panel, ActionButton, Badge, EmptyState, Field, StatTile, inputClass,
} from "./AdminPrimitives";

const GRANT_KINDS = [
  { id: "free_picks", label: "Free picks" },
  { id: "room_credits", label: "Arenas to host" },
  { id: "contender_credits", label: "Contender slots" },
];

const num = (n: number) => Math.round(n).toLocaleString("en-US");

/**
 * Tuning the economy.
 *
 * Every number that decides what an action is worth lives here rather than in
 * a deploy, because the right value is only discoverable by watching people
 * play. The leaderboard is the feedback loop: if one person has ten times
 * everyone else's points, a rate is wrong.
 */
export default function RewardsPanel({
  rates,
  items,
  achievements,
  earners,
  totals,
}: {
  rates: RateRow[];
  items: AdminReward[];
  achievements: AdminAchievement[];
  earners: Earner[];
  totals: { awarded: number; spent: number; unlocks: number };
}) {
  const [rateDraft, setRateDraft] = useState<Record<string, string>>(
    Object.fromEntries(rates.map((r) => [r.key, String(r.value)]))
  );
  const [achDraft, setAchDraft] = useState<Record<string, { points: string; threshold: string }>>({});
  const [grant, setGrant] = useState({ profileId: "", points: "100", reason: "" });
  const [flash, setFlash] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    slug: "", name: "", description: "", cost: "100",
    grantKind: "free_picks", grantAmount: "10",
  });

  return (
    <div className="flex flex-col gap-6">
      {/* ---------------------------------------------------------- HEALTH */}
      <Panel
        title="The economy"
        subtitle="What has been handed out, and what has been spent."
        action={
          <ActionButton
            onRun={async () => {
              const res = await backfillAchievements();
              if (res.ok) setFlash(`Re-checked ${res.data.checked} profiles.`);
              return res.ok ? { ok: true } : res;
            }}
          >
            <RefreshCw className="w-3 h-3" /> Re-check achievements
          </ActionButton>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile label="Points awarded" value={num(totals.awarded)} />
          <StatTile label="Points spent" value={num(totals.spent)} accent="text-amber-500" />
          <StatTile
            label="In circulation"
            value={num(totals.awarded - totals.spent)}
            accent="text-emerald-500"
          />
          <StatTile label="Badges unlocked" value={num(totals.unlocks)} />
        </div>

        {flash && (
          <p role="status" className="mt-3 text-[11px] text-emerald-500 font-sans">{flash}</p>
        )}

        <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground font-sans">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Rate changes apply to the next award, never retroactively: the ledger is a record of
            what was true when it happened. Lowering an achievement threshold does need the
            re-check above, so people who already qualify are given it without doing it again.
          </span>
        </p>
      </Panel>

      {/* ----------------------------------------------------------- RATES */}
      <Panel title="What each action is worth" subtitle="Takes effect immediately, for future awards.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rates.map((rate) => (
            <div
              key={rate.key}
              className="flex items-end gap-3 p-3 bg-background border border-border/60 rounded-xl"
            >
              <div className="w-24 shrink-0">
                <Field label="Points">
                  <input
                    type="number"
                    min={0}
                    value={rateDraft[rate.key] ?? ""}
                    onChange={(e) => setRateDraft({ ...rateDraft, [rate.key]: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="min-w-0 flex-1">
                <span className="block font-mono text-[11px] font-bold text-foreground">
                  {rate.label}
                </span>
                <span className="block text-[10px] text-muted-foreground font-sans leading-snug">
                  {rate.hint}
                </span>
              </div>

              <ActionButton
                variant="primary"
                onRun={() => setPointRate(rate.key, Number(rateDraft[rate.key]))}
              >
                <Save className="w-3 h-3" />
              </ActionButton>
            </div>
          ))}
        </div>
      </Panel>

      {/* ----------------------------------------------------------- STORE */}
      <Panel
        title="The store"
        subtitle="What points buy. Shown at /rewards."
        action={<Badge tone="hot">{items.filter((i) => i.isActive).length} live</Badge>}
      >
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-3 p-3 bg-background border border-border/60 rounded-xl"
            >
              <span className="shrink-0 rounded-lg bg-primary/10 border border-primary/30 p-2 text-primary">
                <Gift className="w-3.5 h-3.5" />
              </span>

              <div className="min-w-0 flex-1">
                <span className="block font-mono text-[11px] font-bold text-foreground truncate">
                  {item.name}
                </span>
                <span className="block text-[10px] text-muted-foreground font-sans truncate">
                  {num(item.cost)} points, grants {item.grantAmount}{" "}
                  {GRANT_KINDS.find((g) => g.id === item.grantKind)?.label.toLowerCase()}
                </span>
              </div>

              {!item.isActive && <Badge tone="bad">Hidden</Badge>}

              <ActionButton onRun={() => setRewardActive(item.id, !item.isActive)}>
                {item.isActive ? "Hide" : "Show"}
              </ActionButton>
            </div>
          ))}
        </div>

        {/* New item */}
        <div className="mt-4 pt-4 border-t border-border/60 flex flex-col gap-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Add a reward
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Name">
              <input
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value, slug: e.target.value })
                }
                placeholder="25 free picks"
                className={inputClass}
              />
            </Field>

            <Field label="Cost in points">
              <input
                type="number"
                min={1}
                value={newItem.cost}
                onChange={(e) => setNewItem({ ...newItem, cost: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Description">
            <input
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="What they get, in their words."
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Grants">
              <select
                value={newItem.grantKind}
                onChange={(e) => setNewItem({ ...newItem, grantKind: e.target.value })}
                className={inputClass}
              >
                {GRANT_KINDS.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </Field>

            <Field label="How many">
              <input
                type="number"
                min={1}
                value={newItem.grantAmount}
                onChange={(e) => setNewItem({ ...newItem, grantAmount: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <ActionButton
              variant="primary"
              disabled={!newItem.name.trim()}
              onRun={async () => {
                const res = await upsertRewardItem({
                  slug: newItem.slug,
                  name: newItem.name,
                  description: newItem.description,
                  cost: Number(newItem.cost),
                  grantKind: newItem.grantKind,
                  grantAmount: Number(newItem.grantAmount),
                });

                if (res.ok) {
                  setNewItem({
                    slug: "", name: "", description: "", cost: "100",
                    grantKind: "free_picks", grantAmount: "10",
                  });
                }
                return res;
              }}
            >
              <Plus className="w-3 h-3" /> Add reward
            </ActionButton>
          </div>
        </div>
      </Panel>

      {/* ---------------------------------------------------- ACHIEVEMENTS */}
      <Panel
        title="Achievements"
        subtitle="Tune what each is worth and how hard it is."
        action={<Badge>{achievements.length} defined</Badge>}
      >
        <ul className="flex flex-col gap-2">
          {achievements.map((a) => {
            const draft = achDraft[a.id] ?? {
              points: String(a.points),
              threshold: String(a.threshold),
            };

            return (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-3 p-3 bg-background border border-border/60 rounded-xl"
              >
                <span className="shrink-0 rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-amber-500">
                  <Trophy className="w-3.5 h-3.5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-foreground">{a.name}</span>
                    <Badge>{a.tier}</Badge>
                    {!a.isActive && <Badge tone="bad">Off</Badge>}
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      {a.unlockedCount} unlocked
                    </span>
                  </div>
                  <span className="block text-[10px] text-muted-foreground font-sans">
                    {a.description} · measures {a.metric}
                  </span>
                </div>

                <div className="w-20">
                  <Field label="Points">
                    <input
                      type="number"
                      min={0}
                      value={draft.points}
                      onChange={(e) =>
                        setAchDraft({ ...achDraft, [a.id]: { ...draft, points: e.target.value } })
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="w-20">
                  <Field label="Needs">
                    <input
                      type="number"
                      min={1}
                      value={draft.threshold}
                      onChange={(e) =>
                        setAchDraft({ ...achDraft, [a.id]: { ...draft, threshold: e.target.value } })
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="flex items-center gap-2">
                  <ActionButton
                    variant="primary"
                    onRun={() =>
                      updateAchievement({
                        id: a.id,
                        points: Number(draft.points),
                        threshold: Number(draft.threshold),
                      })
                    }
                  >
                    <Save className="w-3 h-3" />
                  </ActionButton>

                  <ActionButton onRun={() => updateAchievement({ id: a.id, isActive: !a.isActive })}>
                    {a.isActive ? "Disable" : "Enable"}
                  </ActionButton>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      {/* -------------------------------------------------------- EARNERS */}
      <Panel title="Top earners" subtitle="If one person has ten times the rest, a rate is wrong.">
        {earners.length === 0 ? (
          <EmptyState message="Nobody has earned a point yet" />
        ) : (
          <ul className="flex flex-col gap-2">
            {earners.map((e, i) => (
              <li
                key={e.id}
                className="flex items-center gap-3 p-2.5 bg-background border border-border/60 rounded-xl"
              >
                <span className="w-5 shrink-0 font-mono text-[11px] font-bold text-muted-foreground tabular-nums">
                  {i + 1}
                </span>

                <LevelBadge level={e.level} variant="dot" className="shrink-0" />

                <Link
                  href={`/u/${e.id}`}
                  target="_blank"
                  className="font-mono text-[11px] font-bold text-foreground hover:text-primary
                             transition-colors truncate flex-1 min-w-0"
                >
                  {e.username ?? "unnamed"}
                </Link>

                {e.streak > 1 && (
                  <span className="shrink-0 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-orange-500">
                    <Flame className="w-3 h-3" /> {e.streak}
                  </span>
                )}

                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
                  {num(e.points)} held
                </span>

                <span className="shrink-0 text-sm font-extrabold text-foreground tabular-nums">
                  {num(e.lifetime)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Manual grant */}
        <div className="mt-4 pt-4 border-t border-border/60 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <Field label="Profile id">
              <input
                value={grant.profileId}
                onChange={(e) => setGrant({ ...grant, profileId: e.target.value })}
                placeholder="Paste from a profile link"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="w-24">
            <Field label="Points">
              <input
                type="number"
                value={grant.points}
                onChange={(e) => setGrant({ ...grant, points: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex-1 min-w-[180px]">
            <Field label="Reason (public on their ledger)">
              <input
                value={grant.reason}
                onChange={(e) => setGrant({ ...grant, reason: e.target.value })}
                placeholder="Competition prize"
                className={inputClass}
              />
            </Field>
          </div>

          <ActionButton
            variant="primary"
            disabled={!grant.profileId.trim()}
            onRun={async () => {
              const res = await grantPoints(grant.profileId.trim(), Number(grant.points), grant.reason);
              if (res.ok) setGrant({ profileId: "", points: "100", reason: "" });
              return res;
            }}
          >
            <Coins className="w-3 h-3" /> Grant
          </ActionButton>
        </div>
      </Panel>
    </div>
  );
}
