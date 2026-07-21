import type { CurrencyConfig, ExchangeRate } from "@/features/settings/types";

interface Props {
  currency: CurrencyConfig;
  rates: ExchangeRate[];
  onChange: (v: CurrencyConfig) => void;
  baseOnly?: boolean;
}

const CURRENCIES = [
  { code: "USD", label: "美元 USD", symbol: "$" },
  { code: "CNY", label: "人民币 CNY", symbol: "¥" },
  { code: "EUR", label: "欧元 EUR", symbol: "€" },
  { code: "GBP", label: "英镑 GBP", symbol: "£" },
  { code: "JPY", label: "日元 JPY", symbol: "¥" },
  { code: "HKD", label: "港币 HKD", symbol: "HK$" },
  { code: "AUD", label: "澳元 AUD", symbol: "A$" },
];

export function CurrencySettings({ currency, rates, onChange, baseOnly }: Props) {
  const baseCurrency = currency.baseCurrency;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-text-muted">数据源基准币种</label>
        <select
          value={baseCurrency}
          onChange={(e) => onChange({ ...currency, baseCurrency: e.target.value })}
          className="h-9 w-full border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent sm:w-48"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
      </div>

      {!baseOnly && (
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-text-muted">显示币种（按汇率换算）</label>
          <select
            value={currency.displayCurrency}
            onChange={(e) => onChange({ ...currency, displayCurrency: e.target.value })}
            className="h-9 w-full border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent sm:w-48"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      {baseCurrency !== currency.displayCurrency && (
        <div className="rounded-sm border border-border-subtle bg-bg/60 p-3">
          <p className="text-xs text-text-muted">
            当前换算：1 {baseCurrency} = {rates.find((r) => r.pair === `${baseCurrency}/${currency.displayCurrency}`)?.rate ?? "—"} {currency.displayCurrency}
          </p>
          <p className="mt-1 text-[10px] text-text-muted">汇率数据来源：模拟数据（实际接入后将实时更新）</p>
        </div>
      )}
    </div>
  );
}
