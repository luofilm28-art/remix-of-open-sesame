import { formatMultiplier, multiplierTone } from "@/lib/game";
import type { PublicRound } from "@/lib/useGame";

const toneClass: Record<string, string> = {
  low: "text-low",
  mid: "text-mid",
  high: "text-high",
};

export function HistoryBar({ rounds }: { rounds: PublicRound[] }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {rounds.slice(0, 22).map((round) => (
        <span
          key={round.id}
          className={`chip-mult shrink-0 border border-border ${toneClass[multiplierTone(round.crash_point ?? 1)]}`}
          title={`Round #${round.round_number} · hash ${round.seed_hash.slice(0, 12)}`}
        >
          {formatMultiplier(round.crash_point ?? 1)}
        </span>
      ))}
    </div>
  );
}
