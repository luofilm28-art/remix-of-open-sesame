import { PlaneSprite } from "@/components/game/PlaneSprite";

type Props = { label?: string };

export function LoadingScreen({ label = "Loading live table…" }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background">
      <div className="relative h-24 w-56 overflow-hidden">
        <div className="absolute left-0 top-7 w-[86px] animate-[loader-fly_1.6s_ease-in-out_infinite]">
          <PlaneSprite />
        </div>
      </div>
      <p className="font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      <div className="h-1 w-56 overflow-hidden rounded-full bg-elevated">
        <div className="h-full w-1/3 animate-[loader-bar_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>
    </div>
  );
}
