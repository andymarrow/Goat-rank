"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Mail, Lock, ShieldAlert, Loader2, User } from "lucide-react";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // Only used for sign up
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Sign Up Flow
        if (!username) throw new Error("Username is required.");
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username }, // This triggers our Postgres function to save the username!
          }
        });
        if (error) throw error;
        
        alert("Success! Check your email to verify your account.");
      } else {
        // Log In Flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="w-full max-w-md bg-card border border-border cut-corner-lg p-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />
      
      <div className="relative z-10">
        <h1 className="text-3xl font-arcade font-black text-foreground uppercase tracking-wider mb-2">
          {isSignUp ? "INITIALIZE UPLINK" : "AUTHORIZE ACCESS"}
        </h1>
        <p className="text-sm font-sans text-foreground/50 mb-8">
          {isSignUp 
            ? "Create an account to host battles and earn 10% commissions." 
            : "Enter your credentials to access your Command Center."}
        </p>

        {error && (
          <div className="bg-battle-red/10 border border-battle-red text-battle-red text-xs font-sans p-3 cut-corner mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-5 mb-8">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input 
                type="text" 
                placeholder="Username (e.g. Ridge)" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-background border border-border cut-corner pl-10 pr-4 py-3 text-foreground font-sans text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-background border border-border cut-corner pl-10 pr-4 py-3 text-foreground font-sans text-sm outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-background border border-border cut-corner pl-10 pr-4 py-3 text-foreground font-sans text-sm outline-none focus:border-primary transition-colors"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full cut-corner py-3 mt-2 flex items-center justify-center gap-3 font-arcade font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
            {isSignUp ? "DEPLOY ACCOUNT" : "LOGIN TO TERMINAL"}
          </button>
        </form>

        {/* OAuth Separator */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="font-arcade text-[10px] text-foreground/30">OR OVERRIDE WITH</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex gap-4">
          <button onClick={() => handleOAuth('google')} type="button" className="flex-1 bg-background border border-border hover:border-primary cut-corner py-3 text-xs font-arcade text-foreground transition-colors">
            GOOGLE
          </button>
          <button onClick={() => handleOAuth('github')} type="button" className="flex-1 bg-background border border-border hover:border-primary cut-corner py-3 text-xs font-arcade text-foreground transition-colors">
            GITHUB
          </button>
        </div>

        <div className="mt-8 text-center">
          <button 
            type="button" 
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-xs font-sans text-foreground/50 hover:text-primary transition-colors underline underline-offset-4"
          >
            {isSignUp ? "Already have an uplink? Login here." : "Need a creator pass? Sign up here."}
          </button>
        </div>

      </div>
    </div>
  );
}