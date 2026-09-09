"use client";

import { useState } from "react";
import { Plus, Trash2, Megaphone, XCircle, Save, ExternalLink, Pencil, HeartHandshake } from "lucide-react";
import Image from "next/image";
import ImageUpload from "./ImageUpload";
import { externalUrl } from "@/lib/url";

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
    description: "",
  });

  // Editing was missing entirely: a charity could be registered, disabled or
  // deleted, but never corrected — and its logo could not be set at all.
  const [editing, setEditing] = useState<string | null>(null);
  const [charityDraft, setCharityDraft] = useState({
    name: "",
    payoutReference: "",
    websiteUrl: "",
    logoUrl: "",
    description: "",
  });

  const startEditing = (c: Charity) => {
    setEditing(c.id);
    setCharityDraft({
      name: c.name,
      payoutReference: c.payout_reference ?? "",
      websiteUrl: c.website_url ?? "",
      logoUrl: c.logo_url ?? "",
      description: c.description ?? "",
    });
  };
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
          <div className="mb-4 border border-primary/40 bg-primary/10 rounded-xl p-3">
            <span className="font-mono text-[9px] uppercase tracking-widest text-primary">
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
              placeholder="🚨 MESSI VS RONALDO CLOSES IN 1 HOUR. VOTE NOW!"
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
          <div className="flex flex-wrap items-end gap-2 mb-4 pb-4 border-b border-border/60">
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
              className="w-9 h-9 bg-muted/30 border border-border/60 rounded-xl cursor-pointer"
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
            <EmptyState message="No categories. Add one above" />
          ) : (
            <ul className="flex flex-col gap-1.5">
              {categories.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 p-2.5 border border-border/60 bg-background rounded-xl"
                >
                  <span
                    className="w-2.5 h-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: c.accent ?? "#FF7A00" }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[11px] font-bold text-foreground">
                      {c.label}
                    </span>
                    <span className="ml-2 text-[10px] text-muted-foreground font-mono">{c.slug}</span>
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
          <div className="flex flex-col gap-2.5 mb-4 pb-4 border-b border-border/60">
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

            <Field label="What they do">
              <input
                value={newCharity.description}
                onChange={(e) => setNewCharity({ ...newCharity, description: e.target.value })}
                placeholder="Emergency food and medical care for children in conflict zones"
                className={inputClass}
              />
            </Field>

            {/* Backers see this logo and link on the arena page, so a charity
                registered without them shows as a bare name. */}
            <Field label="Logo">
              <ImageUpload
                value={newCharity.logoUrl || null}
                onChange={(url) => setNewCharity({ ...newCharity, logoUrl: url ?? "" })}
                size={56}
              />
            </Field>
            <div className="flex justify-end">
              <ActionButton
                variant="primary"
                disabled={!newCharity.name.trim()}
                onRun={async () => {
                  const res = await upsertCharity(newCharity);
                  if (res.ok) {
                    setNewCharity({
                      name: "",
                      payoutReference: "",
                      websiteUrl: "",
                      logoUrl: "",
                      description: "",
                    });
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
                  className="flex flex-col gap-3 p-2.5 border border-border/60 bg-background rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="relative w-9 h-9 shrink-0 rounded-lg overflow-hidden bg-muted/50 border border-border/60 flex items-center justify-center">
                      {c.logo_url ? (
                        <Image src={c.logo_url} alt={c.name} fill sizes="36px" className="object-cover" />
                      ) : (
                        <HeartHandshake className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[11px] font-bold text-foreground truncate block">
                        {c.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-sans block truncate">
                        {c.payout_reference ?? (
                          <span className="text-amber-500">no payout reference</span>
                        )}
                        {!c.logo_url && <span className="text-amber-500"> · no logo</span>}
                        {!c.website_url && <span className="text-amber-500"> · no link</span>}
                      </span>
                    </div>

                    {!c.is_active && <Badge tone="bad">Inactive</Badge>}

                    {externalUrl(c.website_url) && (
                      <a
                        href={externalUrl(c.website_url)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${c.name}`}
                        className="rounded-lg border border-border/60 bg-muted/40 p-1.5 text-muted-foreground
                                   hover:text-primary transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    <ActionButton
                      onRun={async () => {
                        if (editing === c.id) setEditing(null);
                        else startEditing(c);
                        return { ok: true };
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                    </ActionButton>

                    <ActionButton
                      onRun={() =>
                        upsertCharity({
                          id: c.id,
                          name: c.name,
                          // Every field is rewritten on update, so the rest of
                          // the row has to come along or a toggle would wipe it.
                          logoUrl: c.logo_url ?? undefined,
                          websiteUrl: c.website_url ?? undefined,
                          payoutReference: c.payout_reference ?? undefined,
                          description: c.description ?? undefined,
                          isActive: !c.is_active,
                        })
                      }
                    >
                      {c.is_active ? "Disable" : "Enable"}
                    </ActionButton>

                    <ActionButton variant="danger" confirm="Delete?" onRun={() => deleteCharity(c.id)}>
                      <Trash2 className="w-3 h-3" />
                    </ActionButton>
                  </div>

                  {editing === c.id && (
                    <div className="flex flex-col gap-2.5 pt-2.5 border-t border-border/60">
                      <Field label="Charity name">
                        <input
                          value={charityDraft.name}
                          onChange={(e) =>
                            setCharityDraft({ ...charityDraft, name: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Field label="Payout reference">
                          <input
                            value={charityDraft.payoutReference}
                            onChange={(e) =>
                              setCharityDraft({ ...charityDraft, payoutReference: e.target.value })
                            }
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Website">
                          <input
                            value={charityDraft.websiteUrl}
                            onChange={(e) =>
                              setCharityDraft({ ...charityDraft, websiteUrl: e.target.value })
                            }
                            placeholder="https://…"
                            className={inputClass}
                          />
                        </Field>
                      </div>

                      <Field label="What they do">
                        <input
                          value={charityDraft.description}
                          onChange={(e) =>
                            setCharityDraft({ ...charityDraft, description: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Logo">
                        <ImageUpload
                          value={charityDraft.logoUrl || null}
                          onChange={(url) => setCharityDraft({ ...charityDraft, logoUrl: url ?? "" })}
                          size={56}
                        />
                      </Field>

                      <div className="flex justify-end">
                        <ActionButton
                          variant="primary"
                          disabled={!charityDraft.name.trim()}
                          onRun={async () => {
                            const res = await upsertCharity({
                              id: c.id,
                              name: charityDraft.name,
                              payoutReference: charityDraft.payoutReference,
                              websiteUrl: charityDraft.websiteUrl,
                              logoUrl: charityDraft.logoUrl,
                              description: charityDraft.description,
                              isActive: c.is_active,
                            });
                            if (res.ok) setEditing(null);
                            return res;
                          }}
                        >
                          <Save className="w-3 h-3" /> Save charity
                        </ActionButton>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
