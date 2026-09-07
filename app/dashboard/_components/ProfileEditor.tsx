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
        className="px-4 py-2.5 rounded-xl border border-border/80 bg-card text-foreground text-xs font-bold
                   hover:bg-card/80 hover:border-primary/50 transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
      >
        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
        <span>Edit profile</span>
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
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide
                         bg-card border border-border/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 font-sans"
            >
              <div className="relative flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-extrabold uppercase tracking-tight text-foreground">
                    Your identity
                  </h2>
                  <p className="text-xs text-muted-foreground font-sans mt-0.5">
                    This is what other players see next to your votes.
                  </p>
                </div>
                <button
                  onClick={() => !pending && setOpen(false)}
                  aria-label="Close"
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current */}
              <div className="relative flex items-center gap-4">
                <Avatar src={avatar} name={currentName} size={64} />
                <div className="flex-1 min-w-0">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Display name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={24}
                    className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2.5 text-sm
                               text-foreground font-sans outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Library */}
              {avatars.length > 0 && (
                <div className="relative">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
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
                          className={`relative aspect-square rounded-xl bg-zinc-900 border overflow-hidden transition-all cursor-pointer ${
                            active
                              ? "border-primary ring-2 ring-primary/40"
                              : "border-border/80 hover:border-foreground/40"
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
                            <span className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-0.5 rounded-tl-md">
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Or upload your own
                </span>
                <label
                  className="w-full h-20 bg-background border border-border/80 border-dashed rounded-xl
                             flex flex-col items-center justify-center gap-1 text-muted-foreground
                             hover:text-foreground hover:border-primary/60 transition-all cursor-pointer"
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
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Max 3MB
                      </span>
                    </>
                  )}
                </label>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/30 bg-destructive/10
                             px-3.5 py-2.5 text-xs font-sans font-semibold text-destructive"
                >
                  {error}
                </p>
              )}

              <button
                onClick={save}
                disabled={pending || uploading}
                className="w-full rounded-xl bg-primary text-primary-foreground py-3
                           font-bold text-xs uppercase tracking-wider
                           hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50
                           inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                {saved && <Check className="w-4 h-4" />}
                <span>{saved ? "Saved" : "Save changes"}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

