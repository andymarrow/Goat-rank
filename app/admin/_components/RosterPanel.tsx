"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, X, Save, Trash2, Plus, ImageOff } from "lucide-react";

import type { AdminEntity } from "@/actions/admin/roster";
import {
  updateEntity, setEntityModeration, createEntity, deleteEntity,
} from "@/actions/admin/roster";
import type { Category } from "@/actions/admin/config";
import {
  Panel, ActionButton, Badge, EmptyState, Field, inputClass, money,
} from "./AdminPrimitives";

/** next.config.ts only allow-lists these hosts for next/image. */
const ALLOWED_HOSTS = ["images.unsplash.com", "api.dicebear.com"];

function isRenderable(url: string | null) {
  if (!url) return false;
  try {
    return ALLOWED_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

export default function RosterPanel({
  entities,
  categories,
}: {
  entities: AdminEntity[];
  categories: Category[];
}) {
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", category: "", brand_color: "", image_url: "" });
  const [creating, setCreating] = useState({ name: "", category: categories[0]?.label ?? "" });

  const pending = entities.filter((e) => e.moderation_status === "pending");
  const visible = tab === "pending" ? pending : entities;

  return (
    <div className="flex flex-col gap-6">
      {/* ------------------------------------------------- MODERATION QUEUE */}
      <Panel
        title="The roster"
        subtitle="Review paid contender injections; fix troll images, typos and colours."
        action={
          <div className="flex gap-2">
            {(["pending", "all"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`pressable cut-corner border px-3 py-1 font-arcade text-[10px] font-bold
                  uppercase tracking-widest transition-colors ${
                    tab === t
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-border text-foreground/50 hover:text-foreground"
                  }`}
              >
                {t === "pending" ? `Queue (${pending.length})` : `All (${entities.length})`}
              </button>
            ))}
          </div>
        }
      >
        {visible.length === 0 ? (
          <EmptyState
            message={tab === "pending" ? "Queue is clear — nothing awaiting review" : "No contenders yet"}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {visible.map((entity) => {
              const isEditing = editing === entity.id;
              const renderable = isRenderable(entity.image_url);

              return (
                <article
                  key={entity.id}
                  className="corner-ticks relative bg-background border border-border cut-corner overflow-hidden"
                  style={
                    entity.moderation_status === "pending"
                      ? { borderColor: "var(--battle-yellow)" }
                      : undefined
                  }
                >
                  <div className="tex-dots absolute inset-0 pointer-events-none" />

                  <div className="relative flex gap-3 p-3">
                    {/* Image preview — the whole point of the review queue */}
                    <div className="relative w-20 h-20 shrink-0 bg-black cut-corner border border-border overflow-hidden">
                      {renderable ? (
                        <Image
                          src={entity.image_url as string}
                          alt={entity.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-foreground/25">
                          <ImageOff className="w-4 h-4" />
                          <span className="font-arcade text-[8px] uppercase">
                            {entity.image_url ? "Bad host" : "None"}
                          </span>
                        </div>
                      )}
                      <span
                        className="absolute bottom-0 inset-x-0 h-1.5"
                        style={{ backgroundColor: entity.brand_color ?? "#FFFFFF" }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-arcade text-xs font-bold text-foreground truncate">
                          {entity.name}
                        </h3>
                        <Badge
                          tone={
                            entity.moderation_status === "pending"
                              ? "warn"
                              : entity.moderation_status === "rejected"
                              ? "bad"
                              : "good"
                          }
                        >
                          {entity.moderation_status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-foreground/40 font-sans mt-0.5">
                        {entity.category} · {money(entity.lifetime_raised)} raised
                      </p>

                      {!isEditing && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {entity.moderation_status === "pending" && (
                            <>
                              <ActionButton
                                variant="primary"
                                onRun={() => setEntityModeration(entity.id, "approved")}
                              >
                                <Check className="w-3 h-3" /> Approve
                              </ActionButton>
                              <ActionButton
                                variant="danger"
                                onRun={() => setEntityModeration(entity.id, "rejected")}
                              >
                                <X className="w-3 h-3" /> Reject
                              </ActionButton>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setEditing(entity.id);
                              setDraft({
                                name: entity.name,
                                category: entity.category,
                                brand_color: entity.brand_color ?? "#FFFFFF",
                                image_url: entity.image_url ?? "",
                              });
                            }}
                            className="pressable cut-corner border border-border px-3 py-1.5 font-arcade
                                       text-[10px] font-bold uppercase tracking-widest text-foreground/60
                                       hover:text-foreground transition-colors"
                          >
                            Fix
                          </button>

                          <ActionButton
                            variant="danger"
                            confirm="Delete?"
                            onRun={() => deleteEntity(entity.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </ActionButton>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="relative border-t border-border p-3 flex flex-col gap-2.5">
                      <Field label="Name">
                        <input
                          value={draft.name}
                          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                          className={inputClass}
                        />
                      </Field>

                      <div className="grid grid-cols-2 gap-2">
                        <Field label="Category">
                          <input
                            list="roster-categories"
                            value={draft.category}
                            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Brand colour">
                          <div className="flex gap-1.5">
                            <input
                              type="color"
                              value={draft.brand_color}
                              onChange={(e) => setDraft({ ...draft, brand_color: e.target.value })}
                              aria-label="Brand colour picker"
                              className="w-9 h-9 shrink-0 bg-background border border-border cut-corner cursor-pointer"
                            />
                            <input
                              value={draft.brand_color}
                              onChange={(e) => setDraft({ ...draft, brand_color: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                        </Field>
                      </div>

                      <Field label="Replacement image URL">
                        <input
                          value={draft.image_url}
                          onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                          placeholder="https://images.unsplash.com/…"
                          className={inputClass}
                        />
                      </Field>
                      <p className="text-[10px] text-foreground/35 font-sans -mt-1">
                        Allowed hosts: {ALLOWED_HOSTS.join(", ")}
                      </p>

                      <div className="flex gap-2 pt-1">
                        <ActionButton
                          variant="primary"
                          onRun={() => updateEntity(entity.id, draft)}
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
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </Panel>

      {/* --------------------------------------------------------- CREATE */}
      <Panel title="Add contender" subtitle="Create a global entity outside any arena.">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Field label="Name">
              <input
                value={creating.name}
                onChange={(e) => setCreating({ ...creating, name: e.target.value })}
                placeholder="Ayrton Senna"
                className={inputClass}
              />
            </Field>
          </div>
          <div className="flex-1 min-w-[160px]">
            <Field label="Category">
              <select
                value={creating.category}
                onChange={(e) => setCreating({ ...creating, category: e.target.value })}
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
          <ActionButton
            variant="primary"
            disabled={!creating.name.trim()}
            onRun={async () => {
              const res = await createEntity(creating);
              if (res.ok) setCreating({ ...creating, name: "" });
              return res;
            }}
          >
            <Plus className="w-3 h-3" /> Create
          </ActionButton>
        </div>
      </Panel>

      <datalist id="roster-categories">
        {categories.map((c) => (
          <option key={c.id} value={c.label} />
        ))}
      </datalist>
    </div>
  );
}
