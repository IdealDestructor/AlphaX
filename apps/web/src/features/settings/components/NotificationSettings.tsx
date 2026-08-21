import type {
  NotificationSettings as NotificationSettingsType,
  NotificationPref,
} from "@/features/settings/types";

interface Props {
  value: NotificationSettingsType;
  onChange: (v: NotificationSettingsType) => void;
}

type Channel = "email" | "webPush" | "telegram";

const SECTIONS: { key: keyof NotificationSettingsType; label: string; desc: string }[] = [
  { key: "priceAlerts", label: "价格告警", desc: "价格触及告警条件时通知" },
  { key: "aiSignals", label: "交易信号", desc: "新交易信号发布时通知" },
  { key: "newsAlerts", label: "新闻告警", desc: "重大新闻推送时通知" },
];

const DEFAULT_PREF: NotificationPref = {
  email: false,
  webPush: false,
  telegram: false,
};

export function NotificationSettingsSection({ value, onChange }: Props) {
  // 防御：后端/缓存数据可能缺少某个分类，缺失或非对象时回退默认开关，避免读取 undefined 属性崩溃
  const getPref = (key: keyof NotificationSettingsType): NotificationPref => {
    const v = value[key];
    return v && typeof v === "object" ? v : DEFAULT_PREF;
  };

  const toggle = (section: keyof NotificationSettingsType, channel: Channel) => {
    if (section === "systemUpdates") {
      onChange({ ...value, systemUpdates: !value.systemUpdates });
      return;
    }
    const sec = getPref(section);
    onChange({
      ...value,
      [section]: { ...sec, [channel]: !sec[channel] },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {SECTIONS.map((sec) => {
        const pref = getPref(sec.key);
        return (
          <div key={sec.key} className="rounded-sm border border-border-subtle bg-bg/40 p-3">
            <div className="mb-2">
              <p className="text-sm font-medium text-text">{sec.label}</p>
              <p className="text-xs text-text-muted">{sec.desc}</p>
            </div>
            <div className="flex gap-3">
              {(["email", "webPush", "telegram"] as const).map((ch) => {
                const chLabel: Record<Channel, string> = { email: "邮件", webPush: "推送", telegram: "Telegram" };
                return (
                  <label key={ch} className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <input
                      type="checkbox"
                      checked={pref[ch]}
                      onChange={() => toggle(sec.key, ch)}
                      className="h-3.5 w-3.5 accent-accent"
                    />
                    {chLabel[ch]}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="rounded-sm border border-border-subtle bg-bg/40 p-3">
        <div className="mb-2">
          <p className="text-sm font-medium text-text">系统更新</p>
          <p className="text-xs text-text-muted">产品功能更新与维护通知</p>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-text-secondary">
          <input
            type="checkbox"
            checked={value.systemUpdates}
            onChange={() => toggle("systemUpdates", "email")}
            className="h-3.5 w-3.5 accent-accent"
          />
          启用
        </label>
      </div>
    </div>
  );
}
