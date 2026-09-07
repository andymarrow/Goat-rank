"use client";

import { useState, useTransition, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, TriangleAlert } from "lucide-react";

/**
 * Admin primitives.
 *
 * Restyled to match the public UI after the `yeab` PR: rounded corners rather
 * than clipped ones, `text-muted-foreground` rather than foreground opacity
 * steps, mono labels, and soft `shadow-xs` surfaces. Every admin panel draws
 * from these, so the whole console follows from this file.
 */

export const money = (n: number) =>
  `$${(Number(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const compact = (n: number) =>
  (Number(n) || 0).toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** Framed section. */
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
      className={`relative bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xs ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-4 sm:px-5 py-4 border-b border-border/60">
        <div className="min-w-0">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground font-sans">{subtitle}</p>
          )}
        </div>
        {action}
      </header>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

/** Big number tile. */
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
    <div className="relative bg-muted/30 border border-border/60 rounded-xl p-4 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
      </div>
      <div className={`mt-2 font-bold tabular-nums text-2xl md:text-3xl ${accent}`}>{value}</div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground font-sans">{hint}</p>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full bg-background border border-border/80 rounded-xl px-3 py-2.5 text-sm text-foreground " +
  "font-sans outline-none shadow-xs transition-all focus:border-primary focus:ring-1 " +
  "focus:ring-primary/40 placeholder:text-muted-foreground";

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
      "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/70",
    primary: "bg-primary border-primary text-primary-foreground hover:brightness-110 shadow-xs",
    danger: "bg-red-500/10 border-red-500/40 text-red-500 hover:bg-red-500/20",
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
        className={`rounded-lg border px-3 py-1.5 font-mono text-[10px] font-bold uppercase
          tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer
          active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed
          ${armed ? variants.danger : variants[variant]} ${className}`}
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
            className="max-w-[260px] text-[10px] leading-snug text-red-500 font-sans"
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
    neutral: "border-border/60 bg-muted/40 text-muted-foreground",
    good: "border-emerald-500/40 text-emerald-500 bg-emerald-500/10",
    warn: "border-amber-500/40 text-amber-500 bg-amber-500/10",
    bad: "border-red-500/40 text-red-500 bg-red-500/10",
    hot: "border-primary/40 text-primary bg-primary/10",
  };

  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-border/60 rounded-xl py-10 text-center">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

/** Horizontal scroll container — tables must never widen the page. */
export function Scroller({ children }: { children: ReactNode }) {
  return <div className="-mx-4 sm:-mx-5 px-4 sm:px-5 overflow-x-auto scrollbar-hide">{children}</div>;
}
