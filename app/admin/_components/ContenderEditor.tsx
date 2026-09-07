"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ImageOff, Trash2 } from "lucide-react";

import { updateEntity } from "@/actions/admin/roster";
import { removeContenderFromRoom } from "@/actions/admin/rooms";
import ImageFraming from "./ImageFraming";
import ColorPicker from "@/components/ui/ColorPicker";
import Avatar from "@/components/ui/Avatar";
import ImageUpload from "./ImageUpload";
import { ActionButton, Field, inputClass } from "./AdminPrimitives";

type Contender = {
  id: string;
  current_votes: number | string;
  seed_index: number;
  entities: {
    id: string;
    name: string;
    image_url: string | null;
    brand_color: string | null;
  } | null;
};

/**
 * Edit an arena's contenders in place.
 *
 * Changing a contender's name or artwork previously meant leaving Arenas,
 * finding the same entity in Roster and editing it there. Since contenders are
 * shared entities, an edit here updates them everywhere they appear — which is
 * the point, and is called out in the UI so it isn't a surprise.
 */
export default function ContenderEditor({
  contenders,
  roomId,
}: {
  contenders: Contender[];
  roomId: string;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<
    Record<string, { name: string; image_url: string; brand_color: string }>
  >({});

  const rows = [...contenders]
    .filter((c) => c.entities)
    .sort((a, b) => a.seed_index - b.seed_index);

  if (rows.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground font-sans py-2">
        This arena has no contenders yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] leading-relaxed text-muted-foreground font-sans">
        Contenders are shared across every arena they appear in, so an edit here updates them
        platform-wide — including their profile page and lifetime totals.
      </p>

      {rows.map((c) => {
        const e = c.entities!;
        const draft = drafts[e.id] ?? {
          name: e.name,
          image_url: e.image_url ?? "",
          brand_color: e.brand_color ?? "#FF7A00",
        };

        const set = (patch: Partial<typeof draft>) =>
          setDrafts({ ...drafts, [e.id]: { ...draft, ...patch } });

        const backed = Number(c.current_votes) || 0;

        return (
          <div
            key={e.id}
            className="flex flex-col gap-3 p-3 bg-muted/20 border border-border/60 rounded-xl"
          >
            <div className="flex items-center gap-3">
              {e.image_url ? (
                <Avatar src={e.image_url} name={e.name} size={40} color={e.brand_color} />
              ) : (
                <span className="w-10 h-10 shrink-0 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-center text-muted-foreground">
                  <ImageOff className="w-4 h-4" />
                </span>
              )}

              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Seed #{c.seed_index + 1} · ${Number(c.current_votes) || 0} backed
              </span>

              {/* Removing one that has taken money would orphan those pledges,
                  so the action refuses server-side; the button says so first. */}
              <span className="ml-auto shrink-0">
                {backed > 0 ? (
                  <span
                    title="This contender has been backed — removing it would orphan those pledges."
                    className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground"
                  >
                    Locked
                  </span>
                ) : (
                  <ActionButton
                    variant="danger"
                    confirm={`Remove ${e.name} from this arena?`}
                    onRun={async () => {
                      const res = await removeContenderFromRoom(roomId, c.id);
                      if (res.ok) router.refresh();
                      return res;
                    }}
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </ActionButton>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Name">
                <input
                  value={draft.name}
                  onChange={(ev) => set({ name: ev.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Brand colour">
                <ColorPicker value={draft.brand_color} onChange={(c) => set({ brand_color: c })} compact />
              </Field>
            </div>

            <Field label="Image">
              <div className="flex flex-col gap-2">
                <ImageUpload
                  value={draft.image_url || null}
                  onChange={(url) => set({ image_url: url ?? "" })}
                />
                <ImageFraming
                  value={draft.image_url}
                  onChange={(url) => set({ image_url: url })}
                />
              </div>
            </Field>

            <div className="flex justify-end">
              <ActionButton
                variant="primary"
                onRun={() =>
                  updateEntity(e.id, {
                    name: draft.name,
                    image_url: draft.image_url || undefined,
                    brand_color: draft.brand_color,
                  })
                }
              >
                <Save className="w-3 h-3" /> Save contender
              </ActionButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}
