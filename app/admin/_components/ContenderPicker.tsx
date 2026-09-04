"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, Plus, X, Upload, Loader2, ImageOff, Check } from "lucide-react";

import type { AdminEntity } from "@/actions/admin/roster";
import { createClient } from "@/utils/supabase/client";
import { inputClass } from "./AdminPrimitives";

export type PickedContender = {
  /** Set when reusing an existing entity; absent for a brand-new one. */
  entityId?: string;
  name: string;
  color?: string;
  image?: string;
};

/**
 * Search-and-pick contender builder.
 *
 * Replaces a bare "Name | #hex | url" textarea, which gave no way to see who
 * already existed, no artwork, and no upload — you had to know a URL by heart.
 */
export default function ContenderPicker({
  roster,
  picked,
  onChange,
  max = 100,
  category,
}: {
  roster: AdminEntity[];
  picked: PickedContender[];
  onChange: (next: PickedContender[]) => void;
  max?: number;
  category?: string;
}) {
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickedIds = new Set(picked.map((p) => p.entityId).filter(Boolean));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    return roster
      .filter((e) => e.moderation_status !== "rejected")
      .filter((e) => !pickedIds.has(e.id))
      // Same-category contenders first — that is nearly always what you want.
      .sort((a, b) => {
        if (category) {
          const ac = a.category?.toLowerCase() === category.toLowerCase() ? 0 : 1;
          const bc = b.category?.toLowerCase() === category.toLowerCase() ? 0 : 1;
          if (ac !== bc) return ac - bc;
        }
        return Number(b.lifetime_raised) - Number(a.lifetime_raised);
      })
      .filter((e) => (q ? e.name.toLowerCase().includes(q) : true))
      .slice(0, 24);
  }, [roster, query, category, picked.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = (c: PickedContender) => {
    if (picked.length >= max) return;
    onChange([...picked, c]);
  };

  const remove = (i: number) => onChange(picked.filter((_, idx) => idx !== i));

  const upload = async (file: File) => {
    setError(null);

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Use PNG, JPEG or WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(`That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 5MB.`);
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from("contenders")
      .upload(path, file, { cacheControl: "3600", contentType: file.type });

    if (storageError) {
      setError(storageError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("contenders").getPublicUrl(path);

    setNewImage(publicUrl);
    if (!newName) setNewName(file.name.replace(/\.[^.]+$/, "").slice(0, 40));
    setUploading(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ------------------------------------------------ SELECTED LINE-UP */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/50">
            Line-up
          </span>
          <span className="font-arcade text-[10px] text-foreground/35">
            {picked.length} / {max}
          </span>
        </div>

        {picked.length === 0 ? (
          <p className="text-[11px] text-foreground/35 font-sans border border-dashed border-border cut-corner p-4 text-center">
            Search below to add existing contenders, or create a new one.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {picked.map((c, i) => (
              <li
                key={`${c.name}-${i}`}
                className="flex items-center gap-2 bg-background border border-border cut-corner pl-1 pr-2 py-1"
              >
                <span className="relative w-7 h-7 shrink-0 cut-corner overflow-hidden bg-card">
                  {c.image ? (
                    <Image src={c.image} alt={c.name} fill sizes="28px" className="object-cover" />
                  ) : (
                    <span
                      className="w-full h-full flex items-center justify-center font-arcade text-[10px] font-bold text-black"
                      style={{ backgroundColor: c.color ?? "#FF7A00" }}
                    >
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>

                <span className="font-arcade text-[11px] text-foreground truncate max-w-[120px]">
                  {c.name}
                </span>

                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Remove ${c.name}`}
                  className="text-foreground/30 hover:text-battle-red transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ------------------------------------------------- SEARCH EXISTING */}
      <div>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search existing contenders…"
            aria-label="Search contenders"
            className={`${inputClass} pl-8`}
          />
        </div>

        {results.length === 0 ? (
          <p className="text-[11px] text-foreground/35 font-sans py-3 text-center">
            {query ? `Nothing matches "${query}" — create it below.` : "No contenders in the roster yet."}
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 max-h-56 overflow-y-auto scrollbar-hide">
            {results.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() =>
                  add({
                    entityId: e.id,
                    name: e.name,
                    color: e.brand_color ?? undefined,
                    image: e.image_url ?? undefined,
                  })
                }
                disabled={picked.length >= max}
                title={`${e.name} · ${e.category}`}
                className="pressable group relative bg-background border border-border cut-corner
                           overflow-hidden hover:border-primary transition-colors disabled:opacity-40"
              >
                <span className="relative block aspect-square bg-card">
                  {e.image_url ? (
                    <Image src={e.image_url} alt={e.name} fill sizes="80px" className="object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-foreground/20">
                      <ImageOff className="w-4 h-4" />
                    </span>
                  )}
                  <span
                    className="absolute bottom-0 inset-x-0 h-1"
                    style={{ backgroundColor: e.brand_color ?? "#FF7A00" }}
                  />
                  <span className="absolute inset-0 bg-primary/0 group-hover:bg-primary/15 transition-colors flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </span>

                <span className="block px-1.5 py-1 font-arcade text-[9px] text-foreground truncate">
                  {e.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- CREATE NEW */}
      <div className="border-t border-border pt-4">
        <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/50 block mb-2">
          Not in the roster? Create one
        </span>

        <div className="flex items-end gap-3">
          <label
            className="relative w-16 h-16 shrink-0 bg-background border border-border border-dashed
                       cut-corner flex flex-col items-center justify-center gap-1 text-foreground/30
                       hover:text-foreground/60 hover:border-foreground/40 transition-all
                       cursor-pointer overflow-hidden"
          >
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : newImage ? (
              <Image src={newImage} alt="New contender" fill sizes="64px" className="object-cover" />
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span className="font-arcade text-[8px] uppercase">Image</span>
              </>
            )}
          </label>

          <div className="flex-1 min-w-0">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Contender name"
              className={inputClass}
            />
          </div>

          <button
            type="button"
            disabled={!newName.trim() || uploading || picked.length >= max}
            onClick={() => {
              add({ name: newName.trim(), image: newImage ?? undefined });
              setNewName("");
              setNewImage(null);
            }}
            className="pressable cut-corner bg-primary text-primary-foreground px-3 py-2.5
                       font-arcade text-[10px] font-bold uppercase tracking-widest
                       hover:brightness-110 transition-all disabled:opacity-40 inline-flex items-center gap-1.5"
          >
            <Check className="w-3 h-3" /> Add
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-2 text-[11px] text-battle-red font-sans">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
