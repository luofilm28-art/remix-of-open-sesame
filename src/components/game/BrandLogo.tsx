import { PlaneSprite } from "@/components/game/PlaneSprite";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/25 ring-1 ring-primary/50 sm:h-14 sm:w-14">
        <PlaneSprite className="w-8 sm:w-10" />
      </span>
      {compact ? null : (
        <span className="brand-text truncate text-2xl leading-none sm:text-3xl lg:text-4xl">
          COSMO<span className="text-foreground"> Bet</span>
        </span>
      )}
    </div>
  );
}
