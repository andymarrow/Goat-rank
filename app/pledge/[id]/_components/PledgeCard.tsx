"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check, Copy, Crown, HeartHandshake, ArrowRight, Share2, Download,
} from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import type { Pledge } from "@/actions/getPledge";
import { SHARE_TARGETS, shareUrl, pledgeText, type ShareTarget } from "@/lib/share";

const money = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString("en-US")}`;

/**
 * What a backer sees the moment their money lands.
 *
 * This is the page someone is most likely to post, so it is built to be
 * posted: the statement is the hero, the share row is the primary action, and
 * everything else is underneath it. The card mirrors the social image exactly,
 * so what they see here is what their followers will see.
 */
export default function PledgeCard({
  pledge,
  shareId,
  url,
}: {
  pledge: Pledge;
  shareId: string;
  /** Absolute, from the server: window.location is not available until
      hydration, and a share button that renders href="#" on first paint is a
      share button someone will click before it works. */
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  const colour = pledge.contender.color ?? "#FF7A00";
  const arenaHref = `/${pledge.arena.roomType === "global" ? "global" : "battle"}/${pledge.arena.id}`;

  const textFor = (target: ShareTarget) =>
    pledgeText({
      amount: pledge.amount,
      contender: pledge.contender.name,
      xHandle: pledge.contender.xHandle,
      message: pledge.message,
      arenaTitle: pledge.arena.title,
      leading: pledge.standing.leading,
      target,
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${textFor("x")} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard denied. The share buttons still work.
    }
  };

  const nativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: pledge.arena.title, text: textFor("x"), url });
      } else {
        await copy();
      }
    } catch {
      // Share sheet dismissed.
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6 md:py-10 pb-24 flex flex-col gap-5">
      {/* Confirmation, stated once and then got out of the way. */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 self-center rounded-full border border-emerald-500/40
                   bg-emerald-500/10 px-4 py-1.5"
      >
        <Check className="w-3.5 h-3.5 text-emerald-500" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500">
          Pledge confirmed
        </span>
      </motion.div>

      {/* The card. Deliberately the same composition as the social image. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(120% 90% at 85% 0%, ${colour}30 0%, transparent 65%)`,
          }}
        />

        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <Avatar
              src={pledge.contender.image}
              name={pledge.contender.name}
              size={140}
              color={pledge.contender.color}
              className="!w-28 !h-28 sm:!w-36 sm:!h-36 !rounded-3xl shadow-lg"
            />

            {pledge.standing.leading && (
              <span
                className="absolute -top-2 -right-2 rounded-full bg-amber-400 text-black p-1.5 shadow-md"
                aria-hidden="true"
              >
                <Crown className="w-4 h-4" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <span className="text-sm text-muted-foreground font-sans">
              {pledge.voterName} put
            </span>

            <div className="text-5xl sm:text-6xl font-extrabold text-foreground tabular-nums leading-none my-1">
              {money(pledge.amount)}
            </div>

            <span className="text-sm text-muted-foreground font-sans">behind</span>

            <h1
              className="text-2xl sm:text-3xl font-extrabold leading-tight mt-0.5"
              style={{ color: colour }}
            >
              {pledge.contender.name}
            </h1>

            <p className="mt-2 text-xs text-muted-foreground font-sans">
              {pledge.standing.leading
                ? "Now leading the arena."
                : `${pledge.standing.share}% of the pool, rank ${pledge.standing.rank} of ${pledge.standing.of}.`}
            </p>
          </div>
        </div>

        {pledge.message && (
          <div className="relative px-6 sm:px-8 pb-5">
            <p className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-foreground/90 font-sans leading-relaxed">
              &ldquo;{pledge.message}&rdquo;
            </p>
          </div>
        )}

        <div className="relative flex flex-wrap items-center gap-x-4 gap-y-1 px-6 sm:px-8 pb-6 text-xs text-muted-foreground font-sans">
          <Link href={arenaHref} className="hover:text-primary transition-colors font-medium truncate">
            {pledge.arena.title}
          </Link>

          <span className="inline-flex items-center gap-1.5">
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-500" />
            {money(pledge.amount * 0.3)} to {pledge.charityName ?? "charity"}
          </span>
        </div>
      </motion.div>

      {/* Sharing is the point of this page, so it is the primary action. */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Share2 className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Tell them who you backed
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SHARE_TARGETS.map((t) => (
            <a
              key={t.id}
              href={shareUrl(t.id, textFor(t.id), url)}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-xl border px-4 py-3 text-center font-bold text-xs uppercase
                          tracking-wider transition-all cursor-pointer active:scale-[0.98] ${
                            t.id === "x"
                              ? "border-primary bg-primary text-primary-foreground hover:opacity-95"
                              : "border-border/70 bg-card text-foreground hover:border-primary/50"
                          }`}
            >
              {t.label}
            </a>
          ))}

          <button
            type="button"
            onClick={copy}
            className="rounded-xl border border-border/70 bg-card px-4 py-3 font-bold text-xs
                       uppercase tracking-wider text-foreground hover:border-primary/50
                       transition-all cursor-pointer active:scale-[0.98] inline-flex items-center
                       justify-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>

        <button
          type="button"
          onClick={nativeShare}
          className="sm:hidden rounded-xl border border-border/70 bg-muted/30 px-4 py-3 font-bold
                     text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center
                     justify-center gap-2 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" /> More options
        </button>

        {/* The image itself, for anywhere a link preview will not follow. */}
        <a
          href={`/pledge/${shareId}/opengraph-image`}
          target="_blank"
          rel="noopener noreferrer"
          className="self-center inline-flex items-center gap-1.5 font-mono text-[10px] uppercase
                     tracking-wider text-muted-foreground hover:text-primary transition-colors"
        >
          <Download className="w-3 h-3" /> Save the card as an image
        </a>
      </div>

      <Link
        href={arenaHref}
        className="rounded-2xl border border-border/70 bg-card px-5 py-4 flex items-center
                   justify-between gap-3 hover:border-primary/50 transition-colors group"
      >
        <span className="min-w-0">
          <span className="block font-bold text-sm text-foreground truncate">
            Back to the arena
          </span>
          <span className="block text-xs text-muted-foreground">
            {money(pledge.arena.totalPool)} in the pool now
          </span>
        </span>

        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </Link>
    </div>
  );
}
