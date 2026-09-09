"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowBigUp, Sparkles, HeartHandshake, Send, Loader2, ExternalLink, Check, Info,
} from "lucide-react";

import {
  submitRequest, toggleRequestUpvote,
  type PublicRequest, type RequestKind, type RequestStatus,
} from "@/actions/requests";
import { formatSince } from "@/lib/time";

const KINDS: { id: RequestKind; label: string; hint: string; icon: typeof Sparkles }[] = [
  {
    id: "feature",
    label: "Feature",
    hint: "Something the platform should do",
    icon: Sparkles,
  },
  {
    id: "charity",
    label: "Charity",
    hint: "A cause arenas should be able to raise for",
    icon: HeartHandshake,
  },
];

const STATUS_TONE: Record<RequestStatus, string> = {
  open: "border-border/60 bg-muted/50 text-muted-foreground",
  planned: "border-amber-500/40 bg-amber-500/10 text-amber-500",
  shipped: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
  declined: "border-border/60 bg-muted/30 text-muted-foreground/70",
};

const STATUS_LABEL: Record<RequestStatus, string> = {
  open: "Open",
  planned: "Planned",
  shipped: "Shipped",
  declined: "Not planned",
};

/**
 * The public request board.
 *
 * Ranked by backing rather than by date, and open to anyone signed in or not —
 * a suggestion box that asks for an account first is a suggestion box nobody
 * fills. Upvotes are optimistic and re-sort on the spot, so backing something
 * visibly moves it, the same as a battle cry.
 */
export default function RequestsBoard({
  initialRequests,
}: {
  initialRequests: PublicRequest[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<"all" | RequestKind>("all");
  const [kind, setKind] = useState<RequestKind>("feature");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [link, setLink] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(
    () => (filter === "all" ? requests : requests.filter((r) => r.kind === filter)),
    [requests, filter]
  );

  const counts = useMemo(
    () => ({
      all: requests.length,
      feature: requests.filter((r) => r.kind === "feature").length,
      charity: requests.filter((r) => r.kind === "charity").length,
    }),
    [requests]
  );

  const back = (request: PublicRequest) => {
    const delta = request.upvoted ? -1 : 1;

    // Optimistic, then re-ranked: the list is ordered by backing, so a request
    // you just backed has to move now rather than on the next load.
    setRequests((prev) =>
      [...prev]
        .map((r) =>
          r.id === request.id
            ? { ...r, upvoted: !r.upvoted, upvote_count: Math.max(0, r.upvote_count + delta) }
            : r
        )
        .sort(
          (a, b) =>
            b.upvote_count - a.upvote_count ||
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    );

    startTransition(async () => {
      const res = await toggleRequestUpvote(request.id);

      if (!res.ok) {
        // Put it back exactly as it was.
        setRequests((prev) =>
          prev.map((r) =>
            r.id === request.id
              ? { ...r, upvoted: request.upvoted, upvote_count: request.upvote_count }
              : r
          )
        );
      }
    });
  };

  const post = () =>
    startTransition(async () => {
      setError(null);
      setNote(null);

      const res = await submitRequest({ kind, title, detail, link });

      if (!res.ok) {
        setError(res.error ?? "Could not post that.");
        return;
      }

      setNote("Posted. It is on the board below.");
      setTitle("");
      setDetail("");
      setLink("");

      const { listRequests } = await import("@/actions/requests");
      setRequests(await listRequests());
    });

  return (
    <div className="w-full flex flex-col gap-6 py-6 md:py-10 pb-24">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
          Requests
        </span>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Ask for what the arena is missing
        </h1>
        <p className="text-sm text-muted-foreground font-sans max-w-2xl leading-relaxed">
          Two kinds of ask: a feature the platform should have, or a charity arenas should be able
          to raise for. Everything here is public and ranked by how many people back it — no
          account needed to post or to back.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        {/* ------------------------------------------------------------ BOARD */}
        <div className="flex flex-col gap-4 order-2 lg:order-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {([
              ["all", `Everything ${counts.all}`],
              ["feature", `Features ${counts.feature}`],
              ["charity", `Charities ${counts.charity}`],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id as "all" | RequestKind)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  filter === id
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 py-16 text-center flex flex-col items-center gap-2">
              <Sparkles className="w-6 h-6 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-muted-foreground">
                Nothing here yet — post the first one
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {visible.map((r) => {
                const Icon = r.kind === "charity" ? HeartHandshake : Sparkles;

                return (
                  <li
                    key={r.id}
                    className="flex items-start gap-3 sm:gap-4 rounded-2xl bg-card border border-border/80
                               p-4 shadow-xs hover:border-border transition-colors"
                  >
                    {/* Backing */}
                    <button
                      type="button"
                      onClick={() => back(r)}
                      aria-pressed={r.upvoted}
                      aria-label={r.upvoted ? `Remove your backing from ${r.title}` : `Back ${r.title}`}
                      className={`shrink-0 w-12 sm:w-14 rounded-xl border flex flex-col items-center justify-center
                                  py-2 gap-0.5 transition-all cursor-pointer active:scale-95 ${
                                    r.upvoted
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground hover:border-border"
                                  }`}
                    >
                      <ArrowBigUp
                        className={`w-4 h-4 ${r.upvoted ? "fill-current" : ""}`}
                      />
                      <span className="text-sm font-extrabold tabular-nums">{r.upvote_count}</span>
                    </button>

                    <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5
                                      font-mono text-[9px] uppercase tracking-wider ${STATUS_TONE[r.status]}`}
                        >
                          {r.status === "shipped" && <Check className="w-2.5 h-2.5" />}
                          {STATUS_LABEL[r.status]}
                        </span>

                        <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          <Icon className="w-3 h-3" /> {r.kind}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug">
                        {r.title}
                      </h3>

                      {r.detail && (
                        <p className="text-xs text-muted-foreground font-sans leading-relaxed whitespace-pre-line">
                          {r.detail}
                        </p>
                      )}

                      {r.admin_note && (
                        <p className="flex items-start gap-1.5 rounded-xl border border-primary/30 bg-primary/5
                                      px-2.5 py-1.5 text-[11px] text-foreground/80 font-sans">
                          <Info className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
                          <span>{r.admin_note}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground font-sans">
                        <span>{r.author ? `by ${r.author}` : "anonymous"}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatSince(r.created_at)}</span>

                        {r.link && (
                          <a
                            href={r.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" /> link
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ------------------------------------------------------------- FORM */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-20 rounded-2xl bg-card border border-border/80 p-5 shadow-xs flex flex-col gap-4">
          <div>
            <h2 className="font-bold text-base text-foreground">Post a request</h2>
            <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
              Signed in, it carries your name. Signed out, it posts anonymously.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {KINDS.map((k) => {
              const Icon = k.icon;
              const on = kind === k.id;

              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKind(k.id)}
                  className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                    on
                      ? "border-primary bg-primary/10"
                      : "border-border/60 bg-muted/30 hover:border-border"
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1.5 ${on ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`block text-xs font-bold ${on ? "text-primary" : "text-foreground"}`}>
                    {k.label}
                  </span>
                  <span className="block text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {k.hint}
                  </span>
                </button>
              );
            })}
          </div>

          <Field label={kind === "charity" ? "Charity name" : "What should we build?"}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder={
                kind === "charity" ? "Doctors Without Borders" : "Let hosts schedule an arena"
              }
              className={inputClass}
            />
          </Field>

          <Field label="Why (optional)">
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={
                kind === "charity"
                  ? "What they do, and why arenas should raise for them."
                  : "What it would let you do that you cannot do today."
              }
              className={`${inputClass} resize-none`}
            />
          </Field>

          <Field label={kind === "charity" ? "Their website (optional)" : "Reference link (optional)"}>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              maxLength={300}
              placeholder="https://…"
              className={inputClass}
            />
          </Field>

          {error && (
            <p role="alert" className="text-[11px] text-red-500 font-sans">
              {error}
            </p>
          )}
          {note && (
            <p role="status" className="text-[11px] text-emerald-500 font-sans">
              {note}
            </p>
          )}

          <button
            type="button"
            onClick={post}
            disabled={pending || title.trim().length < 3}
            className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-bold text-xs
                       uppercase tracking-wider inline-flex items-center justify-center gap-2
                       hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer
                       disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Post request
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full bg-background border border-border/80 rounded-xl px-3 py-2.5 text-sm text-foreground " +
  "font-sans outline-none shadow-xs transition-all focus:border-primary focus:ring-2 " +
  "focus:ring-primary/20 placeholder:text-muted-foreground/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
