"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, Loader2, Trash2, Shuffle, Plus } from "lucide-react";

import type { AdminAvatar } from "@/actions/admin/avatars";
import { addAvatar, setAvatarActive, deleteAvatar, reassignAvatars } from "@/actions/admin/avatars";
import { createClient } from "@/utils/supabase/client";
import { Panel, ActionButton, Badge, EmptyState, Field, inputClass } from "./AdminPrimitives";

const MAX_BYTES = 3 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export default function AvatarPanel({ avatars }: { avatars: AdminAvatar[] }) {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Use PNG, JPEG, WebP or GIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 3MB.`);
      return;
    }

    setUploading(true);
    const supabase = createClient();

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `library/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { cacheControl: "3600", contentType: file.type });

    if (storageError) {
      console.error("Avatar upload failed:", storageError);
      setError(storageError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    setImageUrl(publicUrl);
    if (!name) setName(file.name.replace(/\.[^.]+$/, "").slice(0, 60));
    setUploading(false);
  };

  const active = avatars.filter((a) => a.is_active).length;

  return (
    <div className="flex flex-col gap-6">
      <Panel
        title="Avatar library"
        subtitle="New signups get a random active avatar. Players can also pick one or upload their own."
        action={
          <div className="flex items-center gap-2">
            <Badge tone={active > 0 ? "good" : "warn"}>{active} active</Badge>
            <ActionButton
              confirm="Reassign?"
              onRun={async () => {
                const res = await reassignAvatars();
                return res.ok ? { ok: true } : res;
              }}
            >
              <Shuffle className="w-3 h-3" /> Reassign defaults
            </ActionButton>
          </div>
        }
      >
        {/* Uploader */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 mb-5 pb-5 border-b border-border">
          <label
            className="relative w-24 h-24 shrink-0 bg-background border border-border border-dashed
                       cut-corner flex flex-col items-center justify-center gap-1 text-foreground/30
                       hover:text-foreground/60 hover:border-foreground/40 transition-all
                       cursor-pointer overflow-hidden"
          >
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : imageUrl ? (
              <Image src={imageUrl} alt="Avatar preview" fill sizes="96px" className="object-cover" />
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span className="font-arcade text-[9px] uppercase tracking-widest">Upload</span>
              </>
            )}
          </label>

          <div className="flex-1 min-w-0">
            <Field label="Avatar name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Neon Ronin"
                className={inputClass}
              />
            </Field>
          </div>

          <ActionButton
            variant="primary"
            disabled={!name.trim() || !imageUrl || uploading}
            onRun={async () => {
              const res = await addAvatar({ name, imageUrl });
              if (res.ok) {
                setName("");
                setImageUrl("");
              }
              return res;
            }}
          >
            <Plus className="w-3 h-3" /> Add to library
          </ActionButton>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 cut-corner border border-battle-red/40 bg-battle-red/10 px-3 py-2
                       text-xs font-sans text-battle-red"
          >
            {error}
          </p>
        )}

        {avatars.length === 0 ? (
          <EmptyState message="Library is empty — upload the first avatar above" />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3">
            {avatars.map((a) => (
              <div
                key={a.id}
                className={`relative bg-background border cut-corner overflow-hidden ${
                  a.is_active ? "border-border" : "border-border opacity-40"
                }`}
              >
                <div className="relative aspect-square">
                  <Image src={a.image_url} alt={a.name} fill sizes="96px" className="object-cover" />
                </div>

                <div className="p-1.5">
                  <p className="font-arcade text-[9px] uppercase tracking-wider text-foreground/70 truncate">
                    {a.name}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <ActionButton onRun={() => setAvatarActive(a.id, !a.is_active)}>
                      {a.is_active ? "Hide" : "Show"}
                    </ActionButton>
                    <ActionButton variant="danger" confirm="Delete?" onRun={() => deleteAvatar(a.id)}>
                      <Trash2 className="w-3 h-3" />
                    </ActionButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
