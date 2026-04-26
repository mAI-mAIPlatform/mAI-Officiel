"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";

type Member = { userId: string; name: string | null; email: string };

export function ProjectMemberMentionInput({
  projectId,
  value,
  onChange,
  placeholder,
  className,
}: {
  projectId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const mentionMatch = value.match(/(?:^|\s)@([^\s@]*)$/);
  const query = (mentionMatch?.[1] ?? "").toLowerCase();

  const { data } = useSWR<{ members: Member[] }>(
    open ? `/api/projects/${projectId}/members` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const members = useMemo(
    () =>
      (data?.members ?? []).filter((member) => {
        const label = (member.name ?? member.email).toLowerCase();
        return label.includes(query);
      }),
    [data?.members, query]
  );

  const replaceMention = (member: Member) => {
    const label = member.name ?? member.email;
    const mention = `[@${label}](#member-${member.userId})`;
    const next = value.replace(/(?:^|\s)@([^\s@]*)$/, ` ${mention} `);
    onChange(next.trimStart());
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        className={className}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next);
          setOpen(/(?:^|\s)@([^\s@]*)$/.test(next));
        }}
        onFocus={() => setOpen(/(?:^|\s)@([^\s@]*)$/.test(value))}
        placeholder={placeholder}
        value={value}
      />

      {open ? (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-black/15 bg-white p-1 shadow-lg">
          {members.length === 0 ? (
            <p className="px-2 py-1 text-xs text-black/60">Aucun membre trouvé.</p>
          ) : (
            members.slice(0, 8).map((member) => (
              <button
                className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-black/5"
                key={member.userId}
                onClick={() => replaceMention(member)}
                type="button"
              >
                @{member.name ?? member.email}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
