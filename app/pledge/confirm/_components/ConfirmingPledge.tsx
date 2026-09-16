"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

import { getPledgeBySession } from "@/actions/getPledge";

const RETRY_MS = 1500;
const GIVE_UP_AFTER = 20;

/**
 * The gap between paying and the pledge existing.
 *
 * Stripe redirects the browser at the same moment it calls the webhook, and
 * the browser usually arrives first. The money is taken either way, so this
 * says "confirming" and retries rather than showing an error for a payment
 * that succeeded. If it never lands, the receipt is the fallback, not a dead
 * end.
 */
export default function ConfirmingPledge({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (attempts >= GIVE_UP_AFTER) return;

    const id = setTimeout(async () => {
      const pledge = await getPledgeBySession(sessionId);

      if (pledge) router.replace(`/pledge/${pledge.paymentId}`);
      else setAttempts((n) => n + 1);
    }, RETRY_MS);

    return () => clearTimeout(id);
  }, [attempts, sessionId, router]);

  const stuck = attempts >= GIVE_UP_AFTER;

  return (
    <div className="w-full max-w-md mx-auto min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center py-16">
      <span className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-emerald-500">
        <ShieldCheck className="w-6 h-6" />
      </span>

      <h1 className="text-xl font-extrabold text-foreground">
        {stuck ? "Your payment went through" : "Confirming your pledge"}
      </h1>

      <p className="text-sm text-muted-foreground font-sans leading-relaxed">
        {stuck ? (
          <>
            It is taking longer than usual to appear in the arena. Nothing is lost: your receipt is
            in your inbox and the pledge will show up shortly. Refresh in a moment, or head back to
            the arena.
          </>
        ) : (
          <>Payment received. Putting your money behind your pick.</>
        )}
      </p>

      {!stuck && (
        <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> This takes a second
        </span>
      )}

      {stuck && (
        <button
          type="button"
          onClick={() => setAttempts(0)}
          className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 font-bold text-xs
                     uppercase tracking-wider hover:opacity-95 transition-opacity cursor-pointer"
        >
          Check again
        </button>
      )}
    </div>
  );
}
