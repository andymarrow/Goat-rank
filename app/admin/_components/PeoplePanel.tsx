"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Undo2, Gavel, ShieldCheck, ShieldOff, Search, Mail, UserPlus, Info,
} from "lucide-react";

import type { AdminProfile } from "@/actions/admin/moderation";
import { setUserBanned, setUserAdmin, inviteAdminByEmail } from "@/actions/admin/moderation";
import { Panel, ActionButton, Badge, EmptyState, inputClass, money } from "./AdminPrimitives";

/**
 * Who can get in, and who is locked out.
 *
 * Granting admin used to live behind a tab inside Feed moderation, which is
 * not where anyone looks for it — the question "how do I add a co-founder?"
 * has an answer now that you can find from the sidebar.
 */
export default function PeoplePanel({ profiles }: { profiles: AdminProfile[] }) {
  const [userQuery, setUserQuery] = useState("");
  const [reason, setReason] = useState<Record<string, string>>({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNote, setInviteNote] = useState<string | null>(null);

  const admins = profiles.filter((p) => p.is_admin);
  const users = profiles.filter((p) =>
    (p.username ?? "").toLowerCase().includes(userQuery.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* ------------------------------------------------- GRANT BY EMAIL */}
      <Panel
        title="Grant admin access"
        subtitle="Promote someone by email and send them a notification."
        action={<Badge tone="hot">{admins.length} admin{admins.length === 1 ? "" : "s"}</Badge>}
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="cofounder@example.com"
                className={`${inputClass} pl-8`}
              />
            </div>
          </div>

          <ActionButton
            variant="primary"
            disabled={!inviteEmail.trim()}
            confirm="Grant admin?"
            onRun={async () => {
              setInviteNote(null);
              const res = await inviteAdminByEmail(inviteEmail);

              if (res.ok) {
                setInviteNote(
                  res.data.emailed
                    ? `${res.data.username} is now an admin and has been emailed.`
                    : `${res.data.username} is now an admin, but the email could not be sent.`
                );
                setInviteEmail("");
              }

              return res;
            }}
          >
            <UserPlus className="w-3 h-3" /> Grant admin
          </ActionButton>
        </div>

        <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground font-sans">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            The person must already have a GOAT Rank account — this grants access to an existing
            user, it cannot create one. Admins can settle arenas, release payouts, delete arenas
            and moderate messages, so grant it sparingly.
          </span>
        </p>

        {inviteNote && (
          <p role="status" className="mt-2 text-[11px] text-emerald-500 font-sans">
            {inviteNote}
          </p>
        )}
      </Panel>

      {/* ----------------------------------------------------- ADMIN LIST */}
      <Panel title="Administrators" subtitle="Everyone who can reach this console.">
        {admins.length === 0 ? (
          <EmptyState message="No admins — which should be impossible from in here" />
        ) : (
          <ul className="flex flex-col gap-2">
            {admins.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-3 p-3 border border-border/60 bg-background rounded-xl"
              >
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />

                <Link
                  href={`/u/${a.id}`}
                  target="_blank"
                  className="font-mono text-[11px] font-bold text-foreground hover:text-primary
                             transition-colors truncate flex-1 min-w-0"
                >
                  {a.username ?? "unnamed"}
                </Link>

                {a.is_banned && <Badge tone="bad">Jailed</Badge>}

                <ActionButton
                  confirm="Revoke?"
                  onRun={() => setUserAdmin(a.id, false)}
                >
                  <ShieldOff className="w-3 h-3" /> Revoke
                </ActionButton>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* ------------------------------------------------------ USER JAIL */}
      <Panel
        title="User jail"
        subtitle="Suspended accounts cannot deploy arenas or withdraw creator funds."
        action={
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Search users"
              aria-label="Search users"
              className={`${inputClass} pl-8 w-44`}
            />
          </div>
        }
      >
        {users.length === 0 ? (
          <EmptyState message="No users match" />
        ) : (
          <ul className="flex flex-col gap-2 max-h-[560px] overflow-y-auto scrollbar-hide">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex flex-wrap items-center gap-3 p-3 border border-border/60 bg-background rounded-xl"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/u/${user.id}`}
                      target="_blank"
                      className="font-mono text-[11px] font-bold text-foreground hover:text-primary transition-colors truncate"
                    >
                      {user.username ?? "unnamed"}
                    </Link>
                    {user.is_admin && <Badge tone="hot">Admin</Badge>}
                    {user.is_banned && <Badge tone="bad">Jailed</Badge>}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
                    Wallet {money(user.wallet_balance)} · earned {money(user.total_earned)}
                    {user.banned_reason && ` · ${user.banned_reason}`}
                  </p>
                </div>

                {user.is_banned ? (
                  <ActionButton onRun={() => setUserBanned(user.id, false)}>
                    <Undo2 className="w-3 h-3" /> Release
                  </ActionButton>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      value={reason[user.id] ?? ""}
                      onChange={(e) => setReason({ ...reason, [user.id]: e.target.value })}
                      placeholder="Reason"
                      aria-label={`Ban reason for ${user.username ?? "user"}`}
                      className={`${inputClass} w-32`}
                    />
                    <ActionButton
                      variant="danger"
                      confirm="Jail?"
                      onRun={() => setUserBanned(user.id, true, reason[user.id])}
                    >
                      <Gavel className="w-3 h-3" /> Jail
                    </ActionButton>
                  </div>
                )}

                <ActionButton
                  confirm={user.is_admin ? "Revoke?" : "Promote?"}
                  onRun={() => setUserAdmin(user.id, !user.is_admin)}
                >
                  {user.is_admin ? (
                    <><ShieldOff className="w-3 h-3" /> Revoke admin</>
                  ) : (
                    <><ShieldCheck className="w-3 h-3" /> Make admin</>
                  )}
                </ActionButton>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
