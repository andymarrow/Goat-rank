"use client";

import { useState } from "react";
import { Plus, Trash2, Megaphone, XCircle, Save } from "lucide-react";

import type { Category, Charity, SiteBanner } from "@/actions/admin/config";
import {
  upsertCategory, deleteCategory, upsertCharity, deleteCharity,
  publishBanner, clearBanners,
} from "@/actions/admin/config";
import {
  Panel, ActionButton, Badge, EmptyState, Field, inputClass,
} from "./AdminPrimitives";

export default function ConfigPanel({
  categories,
  charities,
  banners,
}: {
  categories: Category[];
  charities: Charity[];
  banners: SiteBanner[];
}) {
  const [newCategory, setNewCategory] = useState({ label: "", accent: "#FF7A00" });
  const [newCharity, setNewCharity] = useState({
    name: "",
    payoutReference: "",
    websiteUrl: "",
    logoUrl: "",
  });
  const [banner, setBanner] = useState({
    message: "",
    href: "",
    variant: "hype" as "info" | "alert" | "hype",
  });

  const live = banners.find((b) => b.is_active);

  return (
    <div className="flex flex-col gap-6">
      {/* -------------------------------------------------------- MEGAPHONE */}
      <Panel
        title="Global megaphone"
        subtitle="Pushes one banner to the top of every page. Publishing replaces the live one."
        action={
          live ? (
            <ActionButton variant="danger" confirm="Pull it?" onRun={clearBanners}>
              <XCircle className="w-3 h-3" /> Take down
            </ActionButton>
          ) : (
            <Badge>No banner live</Badge>
          )
        }
      >
        {live && (
          <div className="mb-4 border border-primary/40 bg-primary/10 cut-corner p-3">
            <span className="font-arcade text-[9px] uppercase tracking-widest text-primary">
              Currently live
            </span>
            <p className="mt-1 text-sm font-sans text-foreground">{live.message}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Field label="Message">
            <input
              value={banner.message}
              onChange={(e) => setBanner({ ...banner, message: e.target.value })}
              placeholder="🚨 MESSI VS RONALDO CLOSES IN 1 HOUR — VOTE NOW!"
              maxLength={300}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Field label="Link (optional)">
                <input
                  value={banner.href}
                  onChange={(e) => setBanner({ ...banner, href: e.target.value })}
                  placeholder="/battle/…"
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Tone">
              <select
                value={banner.variant}
                onChange={(e) =>
                  setBanner({ ...banner, variant: e.target.value as typeof banner.variant })
                }
                className={inputClass}
              >
                <option value="hype">Hype</option>
                <option value="info">Info</option>
                <option value="alert">Alert</option>
              </select>
            </Field>
          </div>

          <div className="flex justify-end">
            <ActionButton
              variant="primary"
              disabled={!banner.message.trim()}
              onRun={async () => {
                const res = await publishBanner(banner);
                if (res.ok) setBanner({ ...banner, message: "", href: "" });
                return res;
              }}
            >
              <Megaphone className="w-3 h-3" /> Publish site-wide
            </ActionButton>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ----------------------------------------------------- CATEGORIES */}
        <Panel
          title="Category manager"
          subtitle="Drives the create flow and the homepage filters."
        >
          <div className="flex flex-wrap items-end gap-2 mb-4 pb-4 border-b border-border">
            <div className="flex-1 min-w-[140px]">
              <Field label="New category">
                <input
                  value={newCategory.label}
                  onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
                  placeholder="Anime"
                  className={inputClass}
                />
              </Field>
            </div>
            <input
              type="color"
              value={newCategory.accent}
              onChange={(e) => setNewCategory({ ...newCategory, accent: e.target.value })}
              aria-label="Category accent colour"
              className="w-9 h-9 bg-background border border-border cut-corner cursor-pointer"
            />
            <ActionButton
              variant="primary"
              disabled={!newCategory.label.trim()}
              onRun={async () => {
                const res = await upsertCategory({
                  label: newCategory.label,
                  accent: newCategory.accent,
                  sortOrder: (categories.at(-1)?.sort_order ?? 0) + 10,
                });
                if (res.ok) setNewCategory({ ...newCategory, label: "" });
                return res;
              }}
            >
              <Plus className="w-3 h-3" /> Add
            </ActionButton>
          </div>

          {categories.length === 0 ? (
            <EmptyState message="No categories — add one above" />
          ) : (
            <ul className="flex flex-col gap-1.5">
              {categories.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 p-2.5 border border-border bg-background cut-corner"
                >
                  <span
                    className="w-2.5 h-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: c.accent ?? "#FF7A00" }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-arcade text-[11px] font-bold text-foreground">
                      {c.label}
                    </span>
                    <span className="ml-2 text-[10px] text-foreground/35 font-mono">{c.slug}</span>
                  </div>
                  {!c.is_active && <Badge tone="bad">Hidden</Badge>}
                  <ActionButton
                    onRun={() =>
                      upsertCategory({ id: c.id, label: c.label, isActive: !c.is_active })
                    }
                  >
                    {c.is_active ? "Hide" : "Show"}
                  </ActionButton>
                  <ActionButton variant="danger" confirm="Delete?" onRun={() => deleteCategory(c.id)}>
                    <Trash2 className="w-3 h-3" />
                  </ActionButton>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* ------------------------------------------------------ CHARITIES */}
        <Panel
          title="Charity registry"
          subtitle="Creators pick from this list. Payout reference is where you send the money."
        >
          <div className="flex flex-col gap-2.5 mb-4 pb-4 border-b border-border">
            <Field label="Charity name">
              <input
                value={newCharity.name}
                onChange={(e) => setNewCharity({ ...newCharity, name: e.target.value })}
                placeholder="Save The Children"
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Payout reference">
                <input
                  value={newCharity.payoutReference}
                  onChange={(e) =>
                    setNewCharity({ ...newCharity, payoutReference: e.target.value })
                  }
                  placeholder="Account / EIN"
                  className={inputClass}
                />
              </Field>
              <Field label="Website">
                <input
                  value={newCharity.websiteUrl}
                  onChange={(e) => setNewCharity({ ...newCharity, websiteUrl: e.target.value })}
                  placeholder="https://…"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <ActionButton
                variant="primary"
                disabled={!newCharity.name.trim()}
                onRun={async () => {
                  const res = await upsertCharity(newCharity);
                  if (res.ok) {
                    setNewCharity({ name: "", payoutReference: "", websiteUrl: "", logoUrl: "" });
                  }
                  return res;
                }}
              >
                <Save className="w-3 h-3" /> Register
              </ActionButton>
            </div>
          </div>

          {charities.length === 0 ? (
            <EmptyState message="No charities registered" />
          ) : (
            <ul className="flex flex-col gap-1.5">
              {charities.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 p-2.5 border border-border bg-background cut-corner"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-arcade text-[11px] font-bold text-foreground truncate block">
                      {c.name}
                    </span>
                    <span className="text-[10px] text-foreground/35 font-sans">
                      {c.payout_reference ?? (
                        <span className="text-battle-yellow">no payout reference</span>
                      )}
                    </span>
                  </div>
                  {!c.is_active && <Badge tone="bad">Inactive</Badge>}
                  <ActionButton
                    onRun={() =>
                      upsertCharity({ id: c.id, name: c.name, isActive: !c.is_active })
                    }
                  >
                    {c.is_active ? "Disable" : "Enable"}
                  </ActionButton>
                  <ActionButton variant="danger" confirm="Delete?" onRun={() => deleteCharity(c.id)}>
                    <Trash2 className="w-3 h-3" />
                  </ActionButton>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
