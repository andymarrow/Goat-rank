"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Save, Pin, PinOff, Gavel, Trash2, ExternalLink, Users, Info,
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { AdminRoom } from "@/actions/admin/rooms";
import { updateRoom, setRoomFeatured, forceSettleRoom, deleteRoom } from "@/actions/admin/rooms";
import type { Category, Charity } from "@/actions/admin/config";
import ContenderEditor from "../../../_components/ContenderEditor";
import { Panel, ActionButton, Badge, Field, inputClass, money } from "../../../_components/AdminPrimitives";
import { formatAbsolute, formatCountdown } from "@/lib/time";

/** Datetime-local wants `YYYY-MM-DDTHH:mm` in local time, not an ISO string. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Full arena editor.
 *
 * The list view only ever exposed title and category in a cramped inline row.
 * Everything that defines an arena — its contenders and their artwork, the
 * charity, when it closes, whether it is pinned — lives here instead.
 */
export default function ArenaEditor({
  room,
  categories,
  charities,
}: {
  room: AdminRoom;
  categories: Category[];
  charities: Charity[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState(room.title);
  const [category, setCategory] = useState(room.category);
  const [charityName, setCharityName] = useState(room.charity_name ?? "");
  const [expiresAt, setExpiresAt] = useState(toLocalInput(room.expires_at));
  const [featured, setFeatured] = useState(room.is_featured);

  const publicHref = `/${room.room_type === "global" ? "global" : "battle"}/${room.id}`;
  const isSettled = room.status === "settled";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/admin/arenas"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider
                       text-muted-foreground hover:text-primary transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" /> All arenas
          </Link>

          <h1 className="text-xl md:text-2xl font-extrabold text-foreground truncate">
            {room.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge tone={room.status === "active" ? "good" : isSettled ? "neutral" : "warn"}>
              {room.status.replace("_", " ")}
            </Badge>
            <Badge>{room.room_type}</Badge>
            {room.is_featured && <Badge tone="hot">Pinned</Badge>}
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {money(room.total_pool)} pool · closes {formatCountdown(room.expires_at)}
            </span>
          </div>
        </div>

        <Link
          href={publicHref}
          target="_blank"
          className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 font-mono text-[10px]
                     font-bold uppercase tracking-wider text-muted-foreground hover:text-primary
                     transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ExternalLink className="w-3 h-3" /> View live
        </Link>
      </div>

      {/* Details */}
      <Panel title="Arena details" subtitle="Shown on the card and the arena page.">
        <div className="flex flex-col gap-4">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Category">
              <input
                list="arena-editor-categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Charity">
              <input
                list="arena-editor-charities"
                value={charityName}
                onChange={(e) => setCharityName(e.target.value)}
                placeholder="Pending Charity"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Closes at">
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={inputClass}
            />
          </Field>
          <p className="text-[11px] text-muted-foreground font-sans -mt-2">
            Currently {formatAbsolute(room.expires_at)}. Moving this changes the countdown players
            see; it does not settle the arena.
          </p>

          <div className="flex justify-end">
            <ActionButton
              variant="primary"
              onRun={async () => {
                const res = await updateRoom(room.id, {
                  title,
                  category,
                  charity_name: charityName,
                  expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
                });
                if (res.ok) router.refresh();
                return res;
              }}
            >
              <Save className="w-3 h-3" /> Save details
            </ActionButton>
          </div>
        </div>
      </Panel>

      {/* Contenders */}
      <Panel
        title="Contenders"
        subtitle="Names, artwork and brand colours."
        action={
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {room.room_contenders?.length ?? 0}
          </span>
        }
      >
        <ContenderEditor contenders={room.room_contenders ?? []} />
      </Panel>

      {/* Placement & lifecycle */}
      <Panel title="Placement" subtitle="Where this arena appears, and how it ends.">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton
              variant={featured ? "ghost" : "primary"}
              onRun={async () => {
                const res = await setRoomFeatured(room.id, !featured);
                if (res.ok) {
                  setFeatured(!featured);
                  router.refresh();
                }
                return res;
              }}
            >
              {featured ? (
                <><PinOff className="w-3 h-3" /> Unpin from homepage</>
              ) : (
                <><Pin className="w-3 h-3" /> Pin to homepage</>
              )}
            </ActionButton>

            {!isSettled && (
              <ActionButton
                variant="danger"
                confirm="Settle now?"
                onRun={async () => {
                  const res = await forceSettleRoom(room.id);
                  if (res.ok) router.refresh();
                  return res;
                }}
              >
                <Gavel className="w-3 h-3" /> Force settle
              </ActionButton>
            )}

            <ActionButton
              variant="danger"
              confirm="Delete arena?"
              onRun={async () => {
                const res = await deleteRoom(room.id);
                if (res.ok) router.push("/admin/arenas");
                return res;
              }}
            >
              <Trash2 className="w-3 h-3" /> Delete
            </ActionButton>
          </div>

          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground font-sans">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">Force settle</strong> stops votes and closes the
              arena. It moves no money — the creator&apos;s 10% was already paid per vote as each
              one landed. <strong className="text-foreground">Delete</strong> only works on an arena
              that never took a payment.
            </span>
          </p>
        </div>
      </Panel>

      <datalist id="arena-editor-categories">
        {categories.map((c) => (
          <option key={c.id} value={c.label} />
        ))}
      </datalist>
      <datalist id="arena-editor-charities">
        {charities.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>
    </div>
  );
}
