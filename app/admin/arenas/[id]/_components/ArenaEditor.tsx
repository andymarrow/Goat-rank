"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Save, Pin, PinOff, Gavel, Trash2, ExternalLink, Users, Info, Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { AdminRoom } from "@/actions/admin/rooms";
import {
  updateRoom, setRoomFeatured, forceSettleRoom, deleteRoom, addContenderToRoom,
} from "@/actions/admin/rooms";
import EntitySearch from "@/app/(HOME)/create/_components/EntitySearch";
import ImageUpload from "../../../_components/ImageUpload";
import type { Category, Charity } from "@/actions/admin/config";
import ContenderEditor from "../../../_components/ContenderEditor";
import {
  Panel, ActionButton, Badge, ConfirmDialog, Field, inputClass, money,
} from "../../../_components/AdminPrimitives";
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
  // A datalist only suggests as you type — on a phone it shows nothing at all,
  // so both of these read as empty text boxes. They are real selects now.
  // "" is the legacy value: a charity_name written before the charity list
  // existed, or none chosen yet.
  const [charityId, setCharityId] = useState(room.charity_id ?? "");
  const [expiresAt, setExpiresAt] = useState(toLocalInput(room.expires_at));
  const [featured, setFeatured] = useState(room.is_featured);

  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [newEntityId, setNewEntityId] = useState<string | null>(null);

  const atCapacity = room.room_type === "1v1" && (room.room_contenders?.length ?? 0) >= 2;

  const [confirmDelete, setConfirmDelete] = useState(false);
  const funded = Number(room.total_pool) > 0;

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
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                {/* A room can carry a category that predates the list, or one
                    that was since retired. Keep it selectable so saving the
                    title doesn't silently recategorise the arena. */}
                {!categories.some((c) => c.label === category) && (
                  <option value={category}>{category} — not in the list</option>
                )}
                {categories.map((c) => (
                  <option key={c.id} value={c.label}>
                    {c.label}
                    {c.is_active ? "" : " — hidden"}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Charity">
              <select
                value={charityId}
                onChange={(e) => setCharityId(e.target.value)}
                className={inputClass}
              >
                <option value="">
                  {room.charity_name && room.charity_name !== "Pending Charity" && !room.charity_id
                    ? `${room.charity_name} — not in the list`
                    : "Pending Charity — none chosen"}
                </option>
                {charities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.is_active ? "" : " — inactive"}
                  </option>
                ))}
              </select>
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
                const picked = charities.find((c) => c.id === charityId);

                const res = await updateRoom(room.id, {
                  title,
                  category,
                  // Both columns move together: the id is the link, the name
                  // is what the arena page and the payout ledger display.
                  charity_id: picked?.id ?? null,
                  // Clearing a linked charity resets the name too; a legacy
                  // name with no link is left alone.
                  charity_name:
                    picked?.name ??
                    (room.charity_id ? "Pending Charity" : room.charity_name ?? "Pending Charity"),
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
        <ContenderEditor contenders={room.room_contenders ?? []} roomId={room.id} />

        {/* Adding one was only possible at arena creation, so a global arena
            could never grow after the fact. */}
        <div className="mt-5 pt-5 border-t border-border/60 flex flex-col gap-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Add a contender
          </span>

          {atCapacity ? (
            <p className="text-[11px] text-muted-foreground font-sans">
              A 1v1 arena already has both contenders. Edit one above, or switch to a global arena
              to add more.
            </p>
          ) : (
            <>
              <EntitySearch
                category={category}
                placeholder="Search contenders already on GOAT Rank…"
                onPick={(e) => {
                  setNewEntityId(e.id);
                  setNewName(e.name);
                  setNewImage(e.image_url);
                }}
              />

              <input
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setNewEntityId(null);
                }}
                placeholder="…or type a new name"
                className={inputClass}
              />

              {!newEntityId && (
                <ImageUpload value={newImage} onChange={setNewImage} size={64} />
              )}

              <div className="flex justify-end">
                <ActionButton
                  variant="primary"
                  disabled={!newName.trim()}
                  onRun={async () => {
                    const res = await addContenderToRoom(room.id, {
                      entityId: newEntityId ?? undefined,
                      name: newName,
                      image: newImage ?? undefined,
                    });
                    if (res.ok) {
                      setNewName("");
                      setNewImage(null);
                      setNewEntityId(null);
                      router.refresh();
                    }
                    return res;
                  }}
                >
                  <Plus className="w-3 h-3" /> Add contender
                </ActionButton>
              </div>
            </>
          )}
        </div>
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

            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 font-mono
                         text-[10px] font-bold uppercase tracking-wider text-red-500
                         hover:bg-red-500/20 transition-colors cursor-pointer inline-flex
                         items-center gap-1.5"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
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

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${room.title}"?`}
        confirmLabel="Delete arena"
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          const res = await deleteRoom(room.id, { force: true });
          if (res.ok) router.push("/admin/arenas");
          return res;
        }}
      >
        <p>
          The arena, its contender line-up and its page all disappear. Anyone holding a link to
          it gets a 404.
        </p>

        {funded && (
          <p>
            It holds <strong className="text-foreground">{money(room.total_pool)}</strong> across{" "}
            {room.room_contenders?.length ?? 0} contenders. Deleting destroys the pledge records —
            the only account of who paid what — while the money they moved stays moved: the
            creator&apos;s 10% was credited per pledge as it landed, and each contender&apos;s
            lifetime total still counts it. Nothing here reverses that.
          </p>
        )}

        <p>This cannot be undone.</p>
      </ConfirmDialog>
    </div>
  );
}
