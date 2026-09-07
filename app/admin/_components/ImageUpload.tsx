"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, Loader2, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Upload-or-paste image field.
 *
 * The admin could previously only paste a URL, which meant replacing a troll
 * image required hosting the replacement somewhere else first. Uploads go to
 * the `contenders` bucket and return a public URL the validator accepts.
 */
export default function ImageUpload({
  value,
  onChange,
  size = 72,
  bucket = "contenders",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  size?: number;
  bucket?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Use PNG, JPEG or WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 5MB.`);
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: "3600", contentType: file.type });

    if (storageError) {
      console.error("Upload failed:", storageError);
      setError(storageError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);

    onChange(publicUrl);
    setUploading(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <label
          className="relative shrink-0 bg-muted/30 border border-border/60 border-dashed rounded-xl
                     flex flex-col items-center justify-center gap-1 text-muted-foreground
                     hover:border-primary/60 hover:text-foreground transition-all cursor-pointer overflow-hidden"
          style={{ width: size, height: size }}
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
          ) : value ? (
            <Image src={value} alt="Preview" fill sizes={`${size}px`} className="object-cover" />
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span className="font-mono text-[8px] uppercase tracking-wider">Upload</span>
            </>
          )}
        </label>

        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <input
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder="…or paste an image URL"
            aria-label="Image URL"
            className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs
                       text-foreground font-sans outline-none shadow-xs transition-all
                       focus:border-primary focus:ring-1 focus:ring-primary/40
                       placeholder:text-muted-foreground"
          />

          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="self-start inline-flex items-center gap-1 font-mono text-[9px] uppercase
                         tracking-wider text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-[11px] text-red-500 font-sans">
          {error}
        </p>
      )}
    </div>
  );
}
