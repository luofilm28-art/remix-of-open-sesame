/**
 * Per-platform table configuration.
 *
 * Betting platforms embed the game with their own money rules — currency,
 * minimum stake, maximum stake and the increment used by the +/- buttons and
 * the quick-stake chips. Everything is passed on the embed URL, so no operator
 * data has to be read from the database by the player's browser:
 *
 *   /embed?operator=mybet&currency=KES&min=20&max=500000&step=10&chips=20,50,100,500
 */

export type TableConfig = {
  operator: string | null;
  currency: string;
  minStake: number;
  maxStake: number;
  step: number;
  quickStakes: number[];
};

export const DEFAULT_TABLE_CONFIG: TableConfig = {
  operator: null,
  currency: "UGX",
  minStake: 500,
  maxStake: 1_000_000,
  step: 500,
  quickStakes: [500, 1000, 2500, 5000],
};

const num = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/** Four sensible chips derived from the minimum stake when none are supplied. */
export function defaultChips(min: number): number[] {
  return [1, 2, 5, 10].map((factor) => Math.round(min * factor));
}

export function resolveTableConfig(search: string): TableConfig {
  const params = new URLSearchParams(search);

  const currency = (params.get("currency") ?? DEFAULT_TABLE_CONFIG.currency)
    .toUpperCase()
    .slice(0, 6);

  const minStake = num(params.get("min") ?? params.get("min_stake")) ?? DEFAULT_TABLE_CONFIG.minStake;
  const maxStakeRaw =
    num(params.get("max") ?? params.get("max_stake")) ?? DEFAULT_TABLE_CONFIG.maxStake;
  const maxStake = Math.max(maxStakeRaw, minStake);
  // Any increment the platform wants — not locked to a fixed number.
  const step = num(params.get("step") ?? params.get("stake_step")) ?? minStake;

  const chips = (params.get("chips") ?? "")
    .split(",")
    .map((item) => Number.parseFloat(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0)
    .slice(0, 4);

  return {
    operator: params.get("operator"),
    currency,
    minStake,
    maxStake,
    step,
    quickStakes: (chips.length ? chips : defaultChips(minStake)).map((value) =>
      Math.min(Math.max(value, minStake), maxStake),
    ),
  };
}

export function clampStake(value: number, config: TableConfig): number {
  if (!Number.isFinite(value)) return config.minStake;
  const rounded = Math.round(value * 100) / 100;
  return Math.min(config.maxStake, Math.max(config.minStake, rounded));
}

/** Build the embed URL an operator should use, with their money rules baked in. */
export function buildEmbedUrl(
  origin: string,
  config: Partial<TableConfig> & { operator: string },
): string {
  const params = new URLSearchParams({ operator: config.operator });
  if (config.currency) params.set("currency", config.currency);
  if (config.minStake) params.set("min", String(config.minStake));
  if (config.maxStake) params.set("max", String(config.maxStake));
  if (config.step) params.set("step", String(config.step));
  if (config.quickStakes?.length) params.set("chips", config.quickStakes.join(","));
  return `${origin}/embed?${params.toString()}`;
}
