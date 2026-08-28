"use client";

import { useState } from "react";
import { Upload, Swords, ArrowRight, ArrowLeft } from "lucide-react";

const CATEGORIES = ["Soccer", "Basketball", "Tech", "Gaming", "Movies", "Music"];
const COLORS = ["#FF5C5C", "#3B82F6", "#80FF80", "#FACC15", "#FF8080", "#F9F8F3"];

export default function ContenderStep({ 
  formData, 
  setFormData, 
  onNext, 
  onPrev 
}: { 
  formData: any, 
  setFormData: any, 
  onNext: () => void, 
  onPrev: () => void 
}) {
  
  // Local state for the form before saving to parent
  const [title, setTitle] = useState(formData.title || "");
  const [category, setCategory] = useState(formData.category || "Soccer");
  
  const [c1, setC1] = useState(formData.contenders[0] || { name: "", color: COLORS[0], image: null });
  const [c2, setC2] = useState(formData.contenders[1] || { name: "", color: COLORS[1], image: null });

  const handleContinue = () => {
    // Save to parent state
    setFormData({ ...formData, title, category, contenders: [c1, c2] });
    onNext();
  };

  const isFormValid = title && c1.name && c2.name;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      
      {/* --- BATTLE META --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <label className="text-white/60 font-arcade text-xs tracking-widest mb-2 block">BATTLE TITLE</label>
          <input 
            type="text" 
            placeholder="e.g. The Ultimate GOAT" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-black border border-white/10 cut-corner p-3 text-white font-arcade uppercase outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="w-full md:w-1/3">
          <label className="text-white/60 font-arcade text-xs tracking-widest mb-2 block">CATEGORY</label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-black border border-white/10 cut-corner p-3 text-white font-arcade uppercase outline-none focus:border-primary transition-colors appearance-none"
          >
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* --- CHARACTER SELECT (1v1) --- */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-8">
        
        {/* VS Badge (Desktop Center) */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black border border-white/20 cut-corner items-center justify-center text-white/50 font-arcade font-bold italic">
          VS
        </div>

        {/* Contender 1 */}
        <div className="bg-black/40 border border-white/5 p-5 cut-corner relative overflow-hidden group transition-colors" style={{ borderBottomColor: c1.color, borderBottomWidth: '4px' }}>
          <div className="absolute top-0 right-0 p-2 opacity-10"><Swords className="w-20 h-20" style={{ color: c1.color }}/></div>
          <h4 className="font-arcade text-white text-sm mb-4">CONTENDER 01</h4>
          
          <input 
            type="text" 
            placeholder="Player/Brand Name" 
            value={c1.name}
            onChange={(e) => setC1({...c1, name: e.target.value})}
            className="w-full bg-black border border-white/10 cut-corner p-3 text-white font-arcade uppercase outline-none focus:border-white/40 transition-colors mb-4"
          />

          <div className="mb-4">
            <label className="text-white/40 font-arcade text-[10px] tracking-widest mb-2 block">BRAND COLOR</label>
            <div className="flex gap-2">
              {COLORS.map(color => (
                <button 
                  key={color}
                  onClick={() => setC1({...c1, color})}
                  className={`w-6 h-6 cut-corner transition-transform ${c1.color === color ? 'scale-125 border border-white' : 'opacity-50 hover:opacity-100'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="w-full h-32 bg-black border border-white/10 border-dashed cut-corner flex flex-col items-center justify-center text-white/30 hover:text-white/60 hover:border-white/40 transition-all cursor-pointer">
             <Upload className="w-6 h-6 mb-2" />
             <span className="font-arcade text-[10px]">UPLOAD TRANSPARENT PNG</span>
          </div>
        </div>

        {/* Contender 2 */}
        <div className="bg-black/40 border border-white/5 p-5 cut-corner relative overflow-hidden group transition-colors" style={{ borderBottomColor: c2.color, borderBottomWidth: '4px' }}>
          <div className="absolute top-0 right-0 p-2 opacity-10"><Swords className="w-20 h-20" style={{ color: c2.color }}/></div>
          <h4 className="font-arcade text-white text-sm mb-4">CONTENDER 02</h4>
          
          <input 
            type="text" 
            placeholder="Player/Brand Name" 
            value={c2.name}
            onChange={(e) => setC2({...c2, name: e.target.value})}
            className="w-full bg-black border border-white/10 cut-corner p-3 text-white font-arcade uppercase outline-none focus:border-white/40 transition-colors mb-4"
          />

          <div className="mb-4">
            <label className="text-white/40 font-arcade text-[10px] tracking-widest mb-2 block">BRAND COLOR</label>
            <div className="flex gap-2">
              {COLORS.map(color => (
                <button 
                  key={color}
                  onClick={() => setC2({...c2, color})}
                  className={`w-6 h-6 cut-corner transition-transform ${c2.color === color ? 'scale-125 border border-white' : 'opacity-50 hover:opacity-100'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="w-full h-32 bg-black border border-white/10 border-dashed cut-corner flex flex-col items-center justify-center text-white/30 hover:text-white/60 hover:border-white/40 transition-all cursor-pointer">
             <Upload className="w-6 h-6 mb-2" />
             <span className="font-arcade text-[10px]">UPLOAD TRANSPARENT PNG</span>
          </div>
        </div>

      </div>

      {/* --- NAVIGATION --- */}
      <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/10">
        <button onClick={onPrev} className="text-white/50 hover:text-white font-arcade text-sm flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> BACK
        </button>
        
        <button
          onClick={handleContinue}
          disabled={!isFormValid}
          className={`cut-corner px-8 py-3 font-arcade font-bold flex items-center gap-3 transition-all ${
            isFormValid 
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:translate-x-1' 
              : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}
        >
          <span>REVIEW DEPLOYMENT</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}