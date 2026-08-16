import { Music2, Plus, Volume2, VolumeX } from "lucide-react";

import { Avatar } from "@/components/game/Avatar";
import { BrandLogo } from "@/components/game/BrandLogo";
import { formatMoney } from "@/lib/game";

export function TopBar({
  balance,
  currency = "UGX",
  username,
  sfxOn,
  musicOn,
  onToggleSfx,
  onToggleMusic,
  onSignOut,
}: {
  balance: number | null;
  currency?: string;
  username: string | null;
  sfxOn: boolean;
  musicOn: boolean;
  onToggleSfx: () => void;
  onToggleMusic: () => void;
  onSignOut: () => void;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/50 bg-panel/60 px-3 py-2.5 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-3">
        <BrandLogo compact />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="flex items-center gap-2 rounded-full bg-elevated py-1 pl-1.5 pr-1 ring-1 ring-border/60">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-success font-display text-[9px] font-bold text-success-foreground">
            {currency.slice(0, 2)}
          </span>
          <span className="font-display text-sm font-bold tabular-nums">
            {balance == null ? "—" : `${formatMoney(balance)} ${currency}`}
          </span>
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
            <Plus className="h-3.5 w-3.5" />
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleSfx}
          aria-label="Toggle sound effects"
          className="grid h-8 w-8 place-items-center rounded-full bg-elevated text-muted-foreground ring-1 ring-border/60 hover:text-foreground"
        >
          {sfxOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onToggleMusic}
          aria-label="Toggle background music"
          className={`grid h-8 w-8 place-items-center rounded-full bg-elevated ring-1 ring-border/60 hover:text-foreground ${
            musicOn ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Music2 className="h-4 w-4" />
        </button>

        {username ? (
          <button
            type="button"
            onClick={onSignOut}
            title={`${username} · sign out`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full ring-2 ring-primary/70"
          >
            <Avatar username={username} seed={username} size={30} />
          </button>
        ) : null}
      </div>
    </header>
  );
}
