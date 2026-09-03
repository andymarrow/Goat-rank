"use client";

import { useState } from "react";
import { Upload, Swords, ArrowRight, ArrowLeft, Globe, Plus, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client"; // <-- Supabase Client
import Image from "next/image";

// Categories come from the DB (managed in /admin -> Config) via CreateClient.
const COLORS = ["#FF5C5C", "#3B82F6", "#00E676", "#FACC15", "#FF8080", "#F9F8F3"];

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
  const [uploadError, setUploadError] = useState<string | null>(null);

  // --- SUPABASE STORAGE UPLOAD HANDLER ---
  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
  const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

  const handleImageUpload = async (file: File, contenderId: string, is1v1: boolean) => {
    if (!file) return;

    setUploadError(null);

    // Validate before spending a round-trip. The file picker's `accept` is a
    // hint the OS is free to ignore, so it proves nothing.
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
      // Surface the real reason instead of a blank "Error uploading image!".
      // A missing bucket and a denied RLS policy are very different fixes.
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
    ? (title.trim() && c1.name.trim() && c2.name.trim() && c1.image && c2.image) // Require images for 1v1
    : (title.trim() && globalContenders.every((c: any) => c.name.trim() !== "" && c.image));

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      
      {/* ROOM TYPE TOGGLE */}
      <div className="flex bg-background border border-border cut-corner p-1 mb-8">
        <button onClick={() => setRoomType("1v1")} className={`flex-1 flex items-center justify-center gap-2 py-3 font-arcade text-xs font-bold transition-all cut-corner ${roomType === "1v1" ? "bg-primary text-primary-foreground shadow-lg" : "text-foreground/50 hover:text-foreground"}`}><Swords className="w-4 h-4" /> 1V1 FACE-OFF</button>
        <button onClick={() => setRoomType("global")} className={`flex-1 flex items-center justify-center gap-2 py-3 font-arcade text-xs font-bold transition-all cut-corner ${roomType === "global" ? "bg-primary text-primary-foreground shadow-lg" : "text-foreground/50 hover:text-foreground"}`}><Globe className="w-4 h-4" /> GLOBAL ARENA (1 vs 100)</button>
      </div>

      {/* BATTLE META */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <label className="text-foreground/60 font-arcade text-[10px] tracking-widest mb-2 block">ARENA TITLE</label>
          <input type="text" placeholder={roomType === "1v1" ? "e.g. The Ultimate GOAT" : "e.g. Best Sci-Fi Movies"} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-background border border-border cut-corner p-3 text-foreground font-arcade uppercase outline-none focus:border-primary transition-colors" />
        </div>
        <div className="w-full md:w-1/3">
          <label className="text-foreground/60 font-arcade text-[10px] tracking-widest mb-2 block">CATEGORY</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-background border border-border cut-corner p-3 text-foreground font-arcade uppercase outline-none focus:border-primary transition-colors appearance-none cursor-pointer">
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* CHARACTER SELECT DYNAMIC UI */}
      <AnimatePresence mode="wait">
        {roomType === "1v1" ? (
          <motion.div key="1v1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-8">
            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-card border border-border cut-corner items-center justify-center text-foreground/50 font-arcade font-bold italic">VS</div>
            
            {/* Contender 1 */}
            <div className="bg-card border border-border p-5 cut-corner relative group transition-colors" style={{ borderBottomColor: c1.color, borderBottomWidth: '4px' }}>
              <h4 className="font-arcade text-foreground text-sm mb-4">CONTENDER 01</h4>
              <input type="text" placeholder="Name" value={c1.name} onChange={(e) => setC1({...c1, name: e.target.value})} className="w-full bg-background border border-border cut-corner p-3 text-foreground font-arcade uppercase outline-none focus:border-foreground/40 mb-4" />
              <div className="mb-4">
                <label className="text-foreground/40 font-arcade text-[10px] tracking-widest mb-2 block">BRAND COLOR</label>
                <div className="flex gap-2">
                  {COLORS.map(color => <button key={color} onClick={() => setC1({...c1, color})} className={`w-6 h-6 cut-corner transition-transform ${c1.color === color ? 'scale-125 border border-foreground' : 'opacity-50 hover:opacity-100'}`} style={{ backgroundColor: color }} />)}
                </div>
              </div>
              
              {/* UPLOAD UI */}
              <label className="w-full h-32 bg-background border border-border border-dashed cut-corner flex flex-col items-center justify-center text-foreground/30 cursor-pointer hover:text-foreground/60 relative overflow-hidden">
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], "c1", true)} />
                {uploadingId === "c1" ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : c1.image ? <Image src={c1.image} alt="Preview" fill className="object-contain p-2" /> : <><Upload className="w-6 h-6 mb-2" /><span className="font-arcade text-[10px]">UPLOAD PNG</span></>}
              </label>
            </div>

            {/* Contender 2 */}
            <div className="bg-card border border-border p-5 cut-corner relative group transition-colors" style={{ borderBottomColor: c2.color, borderBottomWidth: '4px' }}>
              <h4 className="font-arcade text-foreground text-sm mb-4">CONTENDER 02</h4>
              <input type="text" placeholder="Name" value={c2.name} onChange={(e) => setC2({...c2, name: e.target.value})} className="w-full bg-background border border-border cut-corner p-3 text-foreground font-arcade uppercase outline-none focus:border-foreground/40 mb-4" />
              <div className="mb-4">
                <label className="text-foreground/40 font-arcade text-[10px] tracking-widest mb-2 block">BRAND COLOR</label>
                <div className="flex gap-2">
                  {COLORS.map(color => <button key={color} onClick={() => setC2({...c2, color})} className={`w-6 h-6 cut-corner transition-transform ${c2.color === color ? 'scale-125 border border-foreground' : 'opacity-50 hover:opacity-100'}`} style={{ backgroundColor: color }} />)}
                </div>
              </div>

               {/* UPLOAD UI */}
              <label className="w-full h-32 bg-background border border-border border-dashed cut-corner flex flex-col items-center justify-center text-foreground/30 cursor-pointer hover:text-foreground/60 relative overflow-hidden">
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], "c2", true)} />
                {uploadingId === "c2" ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : c2.image ? <Image src={c2.image} alt="Preview" fill className="object-contain p-2" /> : <><Upload className="w-6 h-6 mb-2" /><span className="font-arcade text-[10px]">UPLOAD PNG</span></>}
              </label>
            </div>
          </motion.div>
        ) : (
          <motion.div key="global" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 mb-8">
            {globalContenders.map((c: any, index: number) => (
              <div key={c.id} className="flex flex-col md:flex-row gap-4 bg-card border border-border p-4 cut-corner relative" style={{ borderLeftColor: c.color, borderLeftWidth: '4px' }}>
                <div className="flex-1"><input type="text" placeholder={`Contender ${index + 1} Name`} value={c.name} onChange={(e) => updateGlobalContender(c.id, 'name', e.target.value)} className="w-full bg-background border border-border cut-corner p-3 text-foreground font-arcade uppercase outline-none focus:border-foreground/40" /></div>
                <div className="flex items-center gap-2">{COLORS.map(color => <button key={color} onClick={() => updateGlobalContender(c.id, 'color', color)} className={`w-6 h-6 cut-corner transition-transform ${c.color === color ? 'scale-125 border border-foreground' : 'opacity-50 hover:opacity-100'}`} style={{ backgroundColor: color }} />)}</div>
                
                {/* UPLOAD UI for GLOBAL */}
                <label className="w-12 h-12 bg-background border border-border cut-corner flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors cursor-pointer relative overflow-hidden" title="Upload Image">
                   <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], c.id, false)} />
                   {uploadingId === c.id ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : c.image ? <Image src={c.image} alt="Preview" fill className="object-cover" /> : <Upload className="w-4 h-4" />}
                </label>

                {globalContenders.length > 1 && (<button onClick={() => removeGlobalContender(c.id)} className="w-12 h-12 bg-battle-red/10 border border-battle-red/20 cut-corner flex items-center justify-center text-battle-red hover:bg-battle-red hover:text-black transition-colors"><Trash2 className="w-4 h-4" /></button>)}
              </div>
            ))}
            <button onClick={addGlobalContender} className="w-full py-4 bg-background border border-border border-dashed cut-corner flex items-center justify-center gap-2 text-foreground/50 font-arcade text-xs hover:text-foreground hover:border-foreground/40 transition-colors"><Plus className="w-4 h-4" /> ADD ANOTHER CONTENDER</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto flex justify-between items-center pt-4 border-t border-border">
        {uploadError && (
          <p
            role="alert"
            className="w-full mb-4 cut-corner border border-battle-red/40 bg-battle-red/10 px-3 py-2
                       text-xs font-sans text-battle-red"
          >
            {uploadError}
          </p>
        )}

        <button onClick={onPrev} className="pressable text-foreground/50 hover:text-foreground font-arcade text-sm flex items-center gap-2 transition-colors"><ArrowLeft className="w-4 h-4" /> BACK</button>
        <button onClick={handleContinue} disabled={!isFormValid} className={`cut-corner px-8 py-3 font-arcade font-bold flex items-center gap-3 transition-all ${isFormValid ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:translate-x-1' : 'bg-card text-foreground/20 cursor-not-allowed border border-border'}`}>
          <span>REVIEW DEPLOYMENT</span><ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}