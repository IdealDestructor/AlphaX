import { Badge } from "@/components/ui/Badge";
import type { ProfileSettings } from "@/features/settings/types";

interface Props {
  profile: ProfileSettings;
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

export function ProfileSection({ profile }: Props) {
  return (
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
  );
}
