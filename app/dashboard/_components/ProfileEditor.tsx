"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Avatar from "@/components/ui/Avatar";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2, Check, Pencil } from "lucide-react";

import { updateProfile, type AvatarOption } from "@/actions/profile";
import { createClient } from "@/utils/supabase/client";

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export default function ProfileEditor({
  currentName,
  currentAvatar,
  avatars,
}: {
  currentName: string;
  currentAvatar: string;
  avatars: AvatarOption[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [avatar, setAvatar] = useState(currentAvatar);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleUpload = async (file: File) => {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Use a PNG, JPEG, WebP or GIF image.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 3MB.`);
      return;
    }

    setUploading(true);
    const supabase = createClient();

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `u/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

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

    setAvatar(publicUrl);
    setUploading(false);
  };

  const save = () =>
    startTransition(async () => {
      setError(null);
      const res = await updateProfile({ username: name, avatarUrl: avatar });

      if (!res.ok) {
        setError(res.error ?? "Could not save.");
        return;
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
      }, 900);
    });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pressable cut-corner border border-border bg-background px-4 py-2
                   font-arcade text-[10px] font-bold uppercase tracking-widest text-foreground/70
                   hover:text-primary hover:border-primary transition-colors inline-flex items-center gap-2"
      >
        <Pencil className="w-3.5 h-3.5" /> Edit profile
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !pending && setOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="corner-ticks relative w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide
                         bg-card border border-border cut-corner-lg p-6 shadow-2xl flex flex-col gap-5"
            >
              <div className="tex-dots absolute inset-0 pointer-events-none" />

              <div className="relative flex items-start justify-between">
                <div>
                  <h2 className="font-arcade text-lg font-bold uppercase tracking-widest text-foreground">
                    Your identity
                  </h2>
                  <p className="text-xs text-foreground/50 font-sans mt-1">
                    This is what other players see next to your votes.
                  </p>
                </div>
                <button
                  onClick={() => !pending && setOpen(false)}
                  aria-label="Close"
                  className="text-foreground/40 hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current */}
              <div className="relative flex items-center gap-4">
                <Avatar src={avatar} name={currentName} size={64} />
                <div className="flex-1 min-w-0">
                  <label className="font-arcade text-[10px] uppercase tracking-widest text-foreground/50 block mb-1.5">
                    Display name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={24}
                    className="w-full bg-background border border-border cut-corner px-3 py-2 text-sm
                               text-foreground font-sans outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Library */}
              {avatars.length > 0 && (
                <div className="relative">
                  <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/50 block mb-2">
                    Pick an avatar
                  </span>
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                    {avatars.map((a) => {
                      const active = avatar === a.image_url;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setAvatar(a.image_url)}
                          title={a.name}
                          aria-pressed={active}
                          className={`pressable relative aspect-square bg-background border cut-corner
                            overflow-hidden transition-colors ${
                              active
                                ? "border-primary ring-1 ring-primary"
                                : "border-border hover:border-foreground/40"
                            }`}
                        >
                          <Image
                            src={a.image_url}
                            alt={a.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                          {active && (
                            <span className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-0.5">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload own */}
              <div className="relative">
                <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/50 block mb-2">
                  Or upload your own
                </span>
                <label
                  className="w-full h-20 bg-background border border-border border-dashed cut-corner
                             flex flex-col items-center justify-center gap-1 text-foreground/30
                             hover:text-foreground/60 hover:border-foreground/40 transition-all cursor-pointer"
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    disabled={uploading || pending}
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                  />
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span className="font-arcade text-[10px] uppercase tracking-widest">
                        Max 3MB
                      </span>
                    </>
                  )}
                </label>
              </div>

              {error && (
                <p
                  role="alert"
                  className="relative cut-corner border border-battle-red/40 bg-battle-red/10
                             px-3 py-2 text-xs font-sans text-battle-red"
                >
                  {error}
                </p>
              )}

              <button
                onClick={save}
                disabled={pending || uploading}
                className="pressable relative w-full cut-corner bg-primary text-primary-foreground py-3
                           font-arcade text-xs font-bold uppercase tracking-widest
                           hover:brightness-110 transition-all disabled:opacity-50
                           inline-flex items-center justify-center gap-2"
              >
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                {saved && <Check className="w-4 h-4" />}
                {saved ? "Saved" : "Save changes"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
