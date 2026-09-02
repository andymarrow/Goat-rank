"use client";

import { useState, useTransition, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, TriangleAlert } from "lucide-react";

export const money = (n: number) =>
  `$${(Number(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const compact = (n: number) =>
  (Number(n) || 0).toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** Framed section. Corner ticks + grid texture, matching the arena HUD. */
export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`corner-ticks relative bg-card border border-border cut-corner-lg overflow-hidden ${className}`}
    >
      <div className="tex-grid absolute inset-0 pointer-events-none" />

      <header className="relative flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="min-w-0">
          <h2 className="font-arcade font-bold text-sm uppercase tracking-widest text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs text-foreground/50 font-sans">{subtitle}</p>
          )}
        </div>
        {action}
      </header>

      <div className="relative p-5">{children}</div>
    </section>
  );
}

/** Big number tile for the treasury / pulse rows. */
export function StatTile({
  label,
  value,
  hint,
  accent = "text-foreground",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="corner-ticks relative bg-background border border-border cut-corner p-4 overflow-hidden">
      <div className="tex-dots absolute inset-0 pointer-events-none" />
      <div className="relative flex items-start justify-between gap-2">
        <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/50">
          {label}
        </span>
        {icon && <span className="text-foreground/30 shrink-0">{icon}</span>}
      </div>
      <div
        className={`relative mt-2 font-arcade font-black tracking-wider tabular-nums text-2xl md:text-3xl ${accent}`}
      >
        {value}
      </div>
      {hint && <p className="relative mt-1 text-[11px] text-foreground/40 font-sans">{hint}</p>}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/50">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full bg-background border border-border cut-corner px-3 py-2 text-sm text-foreground " +
  "font-sans outline-none transition-colors focus:border-primary placeholder:text-foreground/25";

/**
 * Button that runs a server action, shows pending/ok/error inline, and can
 * require a second click to confirm destructive work.
 */
export function ActionButton({
  onRun,
  children,
  variant = "ghost",
  confirm,
  disabled,
  className = "",
  onDone,
}: {
  onRun: () => Promise<{ ok: boolean; error?: string }>;
  children: ReactNode;
  variant?: "ghost" | "primary" | "danger";
  confirm?: string;
  disabled?: boolean;
  className?: string;
  onDone?: (ok: boolean, error?: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [armed, setArmed] = useState(false);
  const [state, setState] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>();

  const variants = {
    ghost:
      "bg-background border-border text-foreground/70 hover:text-foreground hover:border-foreground/40",
    primary:
      "bg-primary border-primary text-primary-foreground hover:brightness-110 shadow-[0_0_15px_rgba(255,122,0,0.25)]",
    danger: "bg-battle-red/10 border-battle-red/40 text-battle-red hover:bg-battle-red/20",
  };

  const run = () => {
    if (confirm && !armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 4000);
      return;
    }

    setArmed(false);
    startTransition(async () => {
      const res = await onRun();
      setState(res.ok ? "ok" : "error");
      setMessage(res.error);
      onDone?.(res.ok, res.error);
      setTimeout(() => setState("idle"), res.ok ? 1600 : 5000);
    });
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={run}
        disabled={disabled || pending}
        title={message}
        className={`pressable cut-corner border px-3 py-1.5 font-arcade text-[10px] font-bold uppercase
          tracking-widest transition-colors inline-flex items-center gap-1.5 disabled:opacity-40
          disabled:cursor-not-allowed ${armed ? variants.danger : variants[variant]} ${className}`}
      >
        {pending && <Loader2 className="w-3 h-3 animate-spin" />}
        {state === "ok" && !pending && <Check className="w-3 h-3" />}
        {state === "error" && !pending && <TriangleAlert className="w-3 h-3" />}
        {armed ? (confirm ?? "Confirm?") : children}
      </button>

      <AnimatePresence>
        {state === "error" && message && (
          <motion.span
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="max-w-[260px] text-[10px] leading-snug text-battle-red font-sans"
          >
            {message}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "hot";
}) {
  const tones = {
    neutral: "border-border text-foreground/50",
    good: "border-battle-green/40 text-battle-green bg-battle-green/10",
    warn: "border-battle-yellow/40 text-battle-yellow bg-battle-yellow/10",
    bad: "border-battle-red/40 text-battle-red bg-battle-red/10",
    hot: "border-primary/40 text-primary bg-primary/10",
  };

  return (
    <span
      className={`cut-corner border px-2 py-0.5 font-arcade text-[9px] font-bold uppercase tracking-widest whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="corner-ticks relative border border-dashed border-border cut-corner py-10 text-center overflow-hidden">
      <div className="tex-hatch absolute inset-0 pointer-events-none" />
      <p className="relative font-arcade text-[11px] uppercase tracking-widest text-foreground/35">
        {message}
      </p>
    </div>
  );
}

/** Horizontal scroll container — tables must never widen the page. */
export function Scroller({ children }: { children: ReactNode }) {
  return <div className="-mx-5 px-5 overflow-x-auto scrollbar-hide">{children}</div>;
}
