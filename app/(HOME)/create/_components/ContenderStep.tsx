"use client";

import { useState } from "react";
import { Upload, Swords, ArrowRight, ArrowLeft, Globe, Plus, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import ColorPicker from "@/components/ui/ColorPicker";
import EntitySearch from "./EntitySearch";
import type { EntityOption } from "@/actions/searchEntities";
import { PALETTE_FLAT } from "@/lib/palette";

const COLORS = PALETTE_FLAT;

export default function ContenderStep({ 
  formData, 
  setFormData, 
  onNext, 
  onPrev,
  categories,
}: { 
  formData: any, 
  setFormData: any, 
  onNext: () => void, 
  onPrev: () => void,
  categories: string[],
}) {
  const CATEGORIES = categories;
  const supabase = createClient();
  const [roomType, setRoomType] = useState(formData.roomType || "1v1");
  const [title, setTitle] = useState(formData.title || "");
  const [category, setCategory] = useState(formData.category || categories[0] || "Sports");
  
  const [c1, setC1] = useState(formData.contenders[0] || { name: "", color: COLORS[0], image: null });
  const [c2, setC2] = useState(formData.contenders[1] || { name: "", color: COLORS[1], image: null });

  const [globalContenders, setGlobalContenders] = useState(
    formData.roomType === "global" && formData.contenders.length > 0 
      ? formData.contenders 
      : [{ id: 1, name: "", color: COLORS[0], image: null }]
  );

  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const applyExisting = (e: EntityOption, slot: "c1" | "c2") => {
    const picked = {
      entityId: e.id,
      name: e.name,
      color: e.brand_color ?? PALETTE_FLAT[0],
      image: e.image_url,
    };
    if (slot === "c1") setC1({ ...c1, ...picked });
    else setC2({ ...c2, ...picked });
  };
  const [uploadError, setUploadError] = useState<string | null>(null);

  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
  const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

  const handleImageUpload = async (file: File, contenderId: string, is1v1: boolean) => {
    if (!file) return;

    setUploadError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError(`"${file.name}" is ${file.type || "an unknown type"}. Use PNG, JPEG or WebP.`);
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError(
        `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 5MB.`
      );
      return;
    }

    setUploadingId(contenderId);

    const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const filePath = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { error: storageError } = await supabase.storage
      .from("contenders")
      .upload(filePath, file, { cacheControl: "3600", upsert: false, contentType: file.type });

    if (storageError) {
      const reason = /bucket/i.test(storageError.message)
        ? "The 'contenders' storage bucket does not exist yet."
        : /policy|denied|unauthorized/i.test(storageError.message)
        ? "Storage rejected the upload — check the bucket's INSERT policy."
        : storageError.message;

      console.error("Supabase Storage upload failed:", storageError);
      setUploadError(reason);
      setUploadingId(null);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("contenders").getPublicUrl(filePath);

    if (is1v1) {
      if (contenderId === "c1") setC1({ ...c1, image: publicUrl });
      if (contenderId === "c2") setC2({ ...c2, image: publicUrl });
    } else {
      setGlobalContenders(
        globalContenders.map((c: any) => (c.id === contenderId ? { ...c, image: publicUrl } : c))
      );
    }

    setUploadingId(null);
  };

  const addGlobalContender = () => setGlobalContenders([...globalContenders, { id: Date.now(), name: "", color: COLORS[Math.floor(Math.random() * COLORS.length)], image: null }]);
  const removeGlobalContender = (id: number) => setGlobalContenders(globalContenders.filter((c: any) => c.id !== id));
  const updateGlobalContender = (id: number, field: string, value: any) => setGlobalContenders(globalContenders.map((c: any) => c.id === id ? { ...c, [field]: value } : c));

  const handleContinue = () => {
    const finalContenders = roomType === "1v1" ? [c1, c2] : globalContenders;
    setFormData({ ...formData, roomType, title, category, contenders: finalContenders });
    onNext();
  };

  const isFormValid = roomType === "1v1" 
    ? (title.trim() && c1.name.trim() && c2.name.trim() && c1.image && c2.image)
    : (title.trim() && globalContenders.every((c: any) => c.name.trim() !== "" && c.image));

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 font-sans">
      
      {/* ROOM TYPE TOGGLE */}
      <div className="flex flex-col xs:flex-row gap-1.5 bg-background border border-border/80 rounded-2xl p-1.5 mb-6 md:mb-8">
        <button
          onClick={() => setRoomType("1v1")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
            roomType === "1v1" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>1V1 FACE-OFF</span>
        </button>
        <button
          onClick={() => setRoomType("global")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
            roomType === "global" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>GLOBAL ARENA</span>
        </button>
      </div>

      {/* BATTLE META */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 md:mb-8">
        <div className="flex-1">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">ARENA TITLE</label>
          <input
            type="text"
            placeholder={roomType === "1v1" ? "e.g. The Ultimate GOAT" : "e.g. Best Sci-Fi Movies"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-background border border-border/80 rounded-xl p-3 text-foreground font-sans text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all shadow-xs"
          />
        </div>
        <div className="w-full md:w-1/3">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">CATEGORY</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-background border border-border/80 rounded-xl p-3 text-foreground font-sans text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all shadow-xs appearance-none cursor-pointer"
          >
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* CHARACTER SELECT DYNAMIC UI */}
      <AnimatePresence mode="wait">
        {roomType === "1v1" ? (
          <motion.div key="1v1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 mb-6 md:mb-8">
            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-zinc-900 border-2 border-amber-500/80 text-amber-500 font-extrabold text-sm items-center justify-center shadow-lg select-none">
              VS
            </div>
            
            {/* Contender 1 */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 relative group transition-all shadow-sm flex flex-col gap-3" style={{ borderBottomColor: c1.color, borderBottomWidth: '4px' }}>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CONTENDER 01</h4>

              <EntitySearch category={category} onPick={(e) => applyExisting(e, "c1")} />

              <input
                type="text"
                placeholder="…or type a new name"
                value={c1.name}
                onChange={(e) => setC1({...c1, name: e.target.value, entityId: undefined})}
                className="w-full bg-background border border-border/80 rounded-xl p-3 text-foreground font-sans text-sm uppercase outline-none focus:border-primary transition-all shadow-xs"
              />
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">BRAND COLOR</label>
                <div className="flex gap-2">
                  <ColorPicker value={c1.color} onChange={(color) => setC1({ ...c1, color })} compact />
                </div>
              </div>
              
              {/* UPLOAD UI */}
              <label className="w-full h-32 bg-background border border-border/80 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/60 transition-all cursor-pointer relative overflow-hidden">
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], "c1", true)} />
                {uploadingId === "c1" ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : c1.image ? <Image src={c1.image} alt="Preview" fill className="object-contain p-2" /> : <><Upload className="w-6 h-6 mb-2" /><span className="text-[10px] font-bold uppercase tracking-wider">UPLOAD PNG</span></>}
              </label>
            </div>

            {/* Contender 2 */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 relative group transition-all shadow-sm flex flex-col gap-3" style={{ borderBottomColor: c2.color, borderBottomWidth: '4px' }}>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CONTENDER 02</h4>

              <EntitySearch category={category} onPick={(e) => applyExisting(e, "c2")} />

              <input
                type="text"
                placeholder="…or type a new name"
                value={c2.name}
                onChange={(e) => setC2({...c2, name: e.target.value, entityId: undefined})}
                className="w-full bg-background border border-border/80 rounded-xl p-3 text-foreground font-sans text-sm uppercase outline-none focus:border-primary transition-all shadow-xs"
              />
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">BRAND COLOR</label>
                <div className="flex gap-2">
                  <ColorPicker value={c2.color} onChange={(color) => setC2({ ...c2, color })} compact />
                </div>
              </div>

              {/* UPLOAD UI */}
              <label className="w-full h-32 bg-background border border-border/80 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/60 transition-all cursor-pointer relative overflow-hidden">
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], "c2", true)} />
                {uploadingId === "c2" ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : c2.image ? <Image src={c2.image} alt="Preview" fill className="object-contain p-2" /> : <><Upload className="w-6 h-6 mb-2" /><span className="text-[10px] font-bold uppercase tracking-wider">UPLOAD PNG</span></>}
              </label>
            </div>
          </motion.div>
        ) : (
          <motion.div key="global" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 mb-8">
            {globalContenders.map((c: any, index: number) => (
              <div key={c.id} className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4 bg-card border border-border/80 rounded-2xl p-4 relative shadow-sm" style={{ borderLeftColor: c.color, borderLeftWidth: '4px' }}>
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <EntitySearch
                    category={category}
                    placeholder={`Search contender ${index + 1}…`}
                    onPick={(e) => {
                      setGlobalContenders(
                        globalContenders.map((g: any) =>
                          g.id === c.id
                            ? {
                                ...g,
                                entityId: e.id,
                                name: e.name,
                                color: e.brand_color ?? g.color,
                                image: e.image_url,
                              }
                            : g
                        )
                      );
                    }}
                  />
                  <input
                    type="text"
                    placeholder="…or type a new name"
                    value={c.name}
                    onChange={(e) => {
                      updateGlobalContender(c.id, "name", e.target.value);
                      updateGlobalContender(c.id, "entityId", undefined);
                    }}
                    className="w-full bg-background border border-border/80 rounded-xl p-2.5 text-foreground font-sans text-sm uppercase outline-none focus:border-primary transition-all shadow-xs"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap"><ColorPicker value={c.color} onChange={(color) => updateGlobalContender(c.id, 'color', color)} compact /></div>
                
                {/* UPLOAD UI for GLOBAL */}
                <label className="w-12 h-12 bg-background border border-border/80 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer relative overflow-hidden" title="Upload Image">
                   <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], c.id, false)} />
                   {uploadingId === c.id ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : c.image ? <Image src={c.image} alt="Preview" fill className="object-cover" /> : <Upload className="w-4 h-4" />}
                </label>

                {globalContenders.length > 1 && (<button onClick={() => removeGlobalContender(c.id)} className="w-12 h-12 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all cursor-pointer"><Trash2 className="w-4 h-4" /></button>)}
              </div>
            ))}
            <button onClick={addGlobalContender} className="w-full py-4 bg-background border border-border/80 border-dashed rounded-2xl flex items-center justify-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wider hover:text-foreground hover:border-primary/60 transition-all cursor-pointer"><Plus className="w-4 h-4" /> ADD ANOTHER CONTENDER</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto flex justify-between items-center pt-4 border-t border-border/80">
        {uploadError && (
          <p
            role="alert"
            className="w-full mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5
                       text-xs font-sans font-semibold text-destructive"
          >
            {uploadError}
          </p>
        )}

        <button onClick={onPrev} className="text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"><ArrowLeft className="w-4 h-4" /> BACK</button>
        <button onClick={handleContinue} disabled={!isFormValid} className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${isFormValid ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-md active:scale-95' : 'bg-card text-muted-foreground cursor-not-allowed border border-border/80 opacity-50'}`}>
          <span>REVIEW DEPLOYMENT</span><ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}