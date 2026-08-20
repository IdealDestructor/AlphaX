import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ProfileSettings } from "@/features/settings/types";

interface Props {
  profile: ProfileSettings;
  onSaveName: (name: string) => void;
  saving?: boolean;
}

const planLabel: Record<string, string> = {
  free: "免费版",
  pro: "Pro",
  max: "Max",
};

const planTone: Record<string, "bull" | "bear" | "wait" | "neutral"> = {
  free: "neutral",
  pro: "bull",
  max: "wait",
};

export function ProfileSection({ profile, onSaveName, saving }: Props) {
  const [name, setName] = useState(profile.name);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center border border-border bg-bg-elevated text-sm font-semibold text-text-secondary">
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-text">{profile.name}</p>
          <p className="text-xs text-text-muted">{profile.email}</p>
          <div className="mt-1">
            <Badge tone={planTone[profile.plan] as "bull" | "bear" | "wait" | "neutral"}>{planLabel[profile.plan]}</Badge>
          </div>
        </div>
      </div>

      <div className="flex max-w-md items-end gap-2">
        <label className="block flex-1">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">昵称</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 w-full border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent"
          />
        </label>
        <Button
          variant="secondary"
          disabled={saving || name.trim() === profile.name || !name.trim()}
          onClick={() => onSaveName(name.trim())}
        >
          保存
        </Button>
      </div>
    </div>
  );
}
