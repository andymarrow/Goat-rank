"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Upload, ShieldAlert, Zap, UserPlus, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { createContenderCheckout } from "@/actions/checkout";

interface AddContenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomTitle: string;
  roomId: string;
}

const COLORS = ["#FF5C5C", "#3B82F6", "#00E676", "#FACC15", "#FF8080", "#F9F8F3"];

export default function AddContenderModal({ isOpen, onClose, roomTitle, roomId }: AddContenderModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[1]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
  const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(`"${file.name}" is ${file.type || "an unknown type"}. Use PNG, JPEG or WebP.`);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 5MB.`);
      return;
    }

    setUploading(true);
    const supabase = createClient();

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from("contenders")
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });

    if (storageError) {
      console.error("Supabase Storage upload failed:", storageError);
      setError(
        /policy|denied|unauthorized/i.test(storageError.message)
          ? "Storage rejected the upload — you may need to sign in again."
          : storageError.message
      );
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("contenders").getPublicUrl(path);

    setImage(publicUrl);
    setUploading(false);
  };

  if (!isOpen) return null;

  const handleDeploy = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createContenderCheckout({ roomId, name, color, imageUrl: image ?? undefined });

      if (res.url) {
        window.location.href = res.url;
        return; // leave the button disabled while the browser navigates
      }

      setError(res.error ?? "Could not start checkout.");
    } catch (err) {
      console.error("Contender checkout failed:", err);
      setError("Could not reach the payment terminal.");
    }

    setIsSubmitting(false);
  };

  const isFormValid = name.trim().length > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isSubmitting ? onClose : undefined}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-card border-2 cut-corner-lg p-6 shadow-2xl flex flex-col gap-6"
          style={{ borderColor: color, boxShadow: `0 0 40px ${color}20` }}
        >
          {/* Close Button */}
          {!isSubmitting && (
            <button onClick={onClose} className="absolute top-4 right-4 text-foreground/50 hover:text-foreground transition-colors">
              <X className="w-6 h-6" />
            </button>
          )}

          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="w-10 h-10 bg-primary/20 flex items-center justify-center cut-corner text-primary">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-foreground/60 font-arcade text-xs tracking-widest">INJECT INTO ARENA</h3>
              <h2 className="text-xl md:text-2xl font-arcade font-bold uppercase text-foreground">
                NEW CONTENDER
              </h2>
            </div>
          </div>

          <p className="text-sm font-sans text-foreground/60 leading-relaxed -mt-2">
            Don't see your GOAT in <strong className="text-foreground">{roomTitle}</strong>? Pay $5 to mint their global profile and permanently inject them into the leaderboard.
          </p>

          {/* Form */}
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-foreground/60 font-arcade text-[10px] tracking-widest mb-2 block">CONTENDER NAME</label>
              <input 
                type="text" 
                placeholder="e.g. Zinedine Zidane" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-border cut-corner p-3 text-foreground font-arcade uppercase outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="text-foreground/60 font-arcade text-[10px] tracking-widest mb-2 block">BRAND COLOR</label>
              <div className="flex gap-3">
                {COLORS.map(c => (
                  <button 
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 cut-corner transition-transform ${color === c ? 'scale-125 border-2 border-foreground shadow-lg' : 'opacity-50 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-foreground/60 font-arcade text-[10px] tracking-widest mb-2 block">TRANSPARENT PNG IMAGE</label>
              <label className="relative w-full h-24 bg-background border border-border border-dashed cut-corner flex flex-col items-center justify-center text-foreground/30 hover:text-foreground/60 hover:border-foreground/40 transition-all cursor-pointer overflow-hidden">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploading || isSubmitting}
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                />

                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : image ? (
                  <Image src={image} alt="Contender preview" fill className="object-contain p-2" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="font-arcade text-[10px]">CLICK TO UPLOAD</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="cut-corner border border-battle-red/40 bg-battle-red/10 px-3 py-2
                         text-xs font-sans text-battle-red"
            >
              {error}
            </p>
          )}

          {/* Checkout Button */}
          <button 
            onClick={handleDeploy}
            disabled={!isFormValid || isSubmitting || uploading}
            className={`w-full cut-corner py-4 flex items-center justify-center gap-3 font-arcade font-bold text-sm transition-all group relative overflow-hidden ${
              isFormValid 
                ? 'hover:brightness-125' 
                : 'opacity-50 cursor-not-allowed grayscale'
            }`}
            style={{ backgroundColor: isFormValid ? color : undefined, color: "#000" }}
          >
            {/* Glossy shine effect */}
            {isFormValid && <div className="absolute inset-0 bg-foreground/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 skew-x-12" />}
            
            <ShieldAlert className="w-4 h-4" />
            <span>{isSubmitting ? "INITIATING UPLINK..." : "PAY $5 TO INJECT"}</span>
            {!isSubmitting && <Zap className="w-4 h-4" />}
          </button>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}