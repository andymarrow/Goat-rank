"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, ShieldAlert, Loader2, User } from "lucide-react";

// Wrap the actual form in a sub-component so we can use useSearchParams safely
function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRoute = searchParams.get('next') ?? "/dashboard";

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        if (!username) throw new Error("Username is required.");

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          }
        });
        if (error) throw error;
        alert("Success! Check your email to verify your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        router.push(nextRoute);
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
        redirectTo: `${window.location.origin}/auth/callback?next=${nextRoute}`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="w-full max-w-md bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group font-sans">
      {/* Soft Ambient Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/15 transition-colors duration-700" />

      <div className="relative z-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground uppercase tracking-tight mb-2">
          {isSignUp ? "INITIALIZE UPLINK" : "AUTHORIZE ACCESS"}
        </h1>
        <p className="text-xs sm:text-sm font-sans text-muted-foreground mb-6">
          {isSignUp
            ? "Create an account to host battles and earn 10% commissions."
            : "Enter your credentials to access your Command Center."}
        </p>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs font-sans font-semibold p-3.5 rounded-xl mb-6 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4 mb-6">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Username (e.g. Ridge)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-background border border-border/80 rounded-xl pl-10 pr-4 py-2.5 text-foreground font-sans text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all shadow-xs"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-background border border-border/80 rounded-xl pl-10 pr-4 py-2.5 text-foreground font-sans text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all shadow-xs"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-background border border-border/80 rounded-xl pl-10 pr-4 py-2.5 text-foreground font-sans text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl py-3 mt-1 flex items-center justify-center gap-2 font-bold text-xs sm:text-sm uppercase tracking-wider bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
            <span>{isSignUp ? "DEPLOY ACCOUNT" : "LOGIN TO TERMINAL"}</span>
          </button>
        </form>

        {/* OAuth Separator */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border/60" />
          <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">OR OVERRIDE WITH</span>
          <div className="flex-1 h-px bg-border/60" />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleOAuth('google')}
            type="button"
            className="flex-1 bg-background hover:bg-card border border-border/80 hover:border-primary/60 rounded-xl py-2.5 text-xs font-bold text-foreground transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Google</span>
          </button>
          <button
            onClick={() => handleOAuth('github')}
            type="button"
            className="flex-1 bg-background hover:bg-card border border-border/80 hover:border-primary/60 rounded-xl py-2.5 text-xs font-bold text-foreground transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>GitHub</span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-xs font-sans font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            {isSignUp ? "Already have an uplink? Login here." : "Need a creator pass? Sign up here."}
          </button>
        </div>

      </div>
    </div>
  );
}

// Next.js requires us to wrap useSearchParams inside a Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <LoginForm />
    </Suspense>
  );
}