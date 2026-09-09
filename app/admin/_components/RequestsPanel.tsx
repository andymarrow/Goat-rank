"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Sparkles, HeartHandshake, Trash2, ExternalLink, Save, ArrowBigUp, Info, HeartPlus,
} from "lucide-react";

import type { AdminRequest } from "@/actions/admin/requests";
import {
  setRequestStatus, deleteRequest, promoteCharityRequest,
} from "@/actions/admin/requests";
import type { RequestStatus } from "@/actions/requests";
import {
  Panel, ActionButton, Badge, ConfirmDialog, EmptyState, inputClass,
} from "./AdminPrimitives";
import { formatSince } from "@/lib/time";

const STATUSES: RequestStatus[] = ["open", "planned", "shipped", "declined"];

const TONE: Record<RequestStatus, "neutral" | "warn" | "good" | "bad"> = {
  open: "neutral",
  planned: "warn",
  shipped: "good",
  declined: "bad",
};

/**
 * The request queue.
 *
 * Sorted by backing, because that is the only signal that says which of these
 * to do first. A charity nomination can be registered in place rather than
 * retyped into Config — retyping is where a backlog stops being worked.
 */
export default function RequestsPanel({ requests }: { requests: AdminRequest[] }) {
  const [filter, setFilter] = useState<"all" | RequestStatus | "feature" | "charity">("all");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<AdminRequest | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const visible = useMemo(() => {
    if (filter === "all") return requests;
    if (filter === "feature" || filter === "charity") {
      return requests.filter((r) => r.kind === filter);
    }
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  const counts = useMemo(
    () => ({
      open: requests.filter((r) => r.status === "open").length,
      charity: requests.filter((r) => r.kind === "charity").length,
      backing: requests.reduce((sum, r) => sum + r.upvote_count, 0),
    }),
    [requests]
  );

  return (
    <div className="flex flex-col gap-6">
      <Panel
        title="Request queue"
        subtitle="What people are asking for, ranked by how many backed it."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="hot">{counts.open} open</Badge>
            <Badge>{counts.backing} backings</Badge>
          </div>
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {(["all", "open", "planned", "shipped", "declined", "feature", "charity"] as const).map(
            (f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg border px-3 py-1.5 font-mono text-[10px] font-bold uppercase
                            tracking-wider transition-colors cursor-pointer ${
                              filter === f
                                ? "bg-primary border-primary text-primary-foreground"
                                : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
                            }`}
              >
                {f}
                {f === "charity" && counts.charity > 0 ? ` ${counts.charity}` : ""}
              </button>
            )
          )}
        </div>

        {flash && (
          <p role="status" className="mt-3 text-[11px] text-emerald-500 font-sans">
            {flash}
          </p>
        )}

        <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground font-sans">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Status and note are both public, the note appears on the request itself at{" "}
            <Link href="/requests" target="_blank" className="text-primary hover:underline">
              /requests
            </Link>
            , so &ldquo;planned&rdquo; can say what that actually means.
          </span>
        </p>
      </Panel>

      <Panel title={`${visible.length} request${visible.length === 1 ? "" : "s"}`} subtitle="Most-backed first.">
        {visible.length === 0 ? (
          <EmptyState message="Nothing matches that filter" />
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((r) => {
              const Icon = r.kind === "charity" ? HeartHandshake : Sparkles;
              const draft = notes[r.id] ?? r.admin_note ?? "";

              return (
                <li
                  key={r.id}
                  className="flex flex-col gap-3 p-3 bg-background border border-border/60 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-11 rounded-lg border border-border/60 bg-muted/40 py-1.5
                                     flex flex-col items-center text-muted-foreground">
                      <ArrowBigUp className="w-3.5 h-3.5" />
                      <span className="text-xs font-extrabold tabular-nums text-foreground">
                        {r.upvote_count}
                      </span>
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge tone={TONE[r.status]}>{r.status}</Badge>
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          <Icon className="w-3 h-3" /> {r.kind}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          {r.author ? `by ${r.author}` : "anonymous"} · {formatSince(r.created_at)}
                        </span>
                      </div>

                      <p className="font-bold text-sm text-foreground leading-snug">{r.title}</p>

                      {r.detail && (
                        <p className="mt-1 text-[11px] text-muted-foreground font-sans leading-relaxed whitespace-pre-line">
                          {r.detail}
                        </p>
                      )}

                      {r.link && (
                        <a
                          href={r.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-primary hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> {r.link.slice(0, 48)}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Public reply */}
                  <input
                    value={draft}
                    onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                    placeholder="Public note, shown on the request"
                    aria-label={`Note for ${r.title}`}
                    className={inputClass}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    {STATUSES.filter((s) => s !== r.status).map((s) => (
                      <ActionButton
                        key={s}
                        variant={s === "shipped" ? "primary" : "ghost"}
                        onRun={() => setRequestStatus(r.id, s, notes[r.id])}
                      >
                        Mark {s}
                      </ActionButton>
                    ))}

                    <ActionButton
                      variant="ghost"
                      onRun={() => setRequestStatus(r.id, r.status, draft)}
                    >
                      <Save className="w-3 h-3" /> Save note
                    </ActionButton>

                    {r.kind === "charity" && (
                      <ActionButton
                        variant="primary"
                        confirm={`Register ${r.title}?`}
                        onRun={async () => {
                          const res = await promoteCharityRequest(r.id);
                          if (res.ok) setFlash(`${res.data.name} is in the charity registry.`);
                          return res.ok ? { ok: true } : res;
                        }}
                      >
                        <HeartPlus className="w-3 h-3" /> Register charity
                      </ActionButton>
                    )}

                    <span className="ml-auto">
                      <button
                        type="button"
                        onClick={() => setPendingDelete(r)}
                        aria-label={`Delete ${r.title}`}
                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5
                                   font-mono text-[10px] font-bold uppercase tracking-wider text-red-500
                                   hover:bg-red-500/20 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <ConfirmDialog
        open={!!pendingDelete}
        title={pendingDelete ? `Delete "${pendingDelete.title}"?` : "Delete request?"}
        confirmLabel="Delete request"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => deleteRequest(pendingDelete!.id)}
      >
        <p>
          The request and its {pendingDelete?.upvote_count ?? 0} backing
          {pendingDelete?.upvote_count === 1 ? "" : "s"} are removed for good. To turn something
          down while leaving the record, mark it <strong className="text-foreground">declined</strong>{" "}
          with a note instead.
        </p>
      </ConfirmDialog>
    </div>
  );
}
