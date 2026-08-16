import { useEffect, useRef } from "react";

import cloudsImage from "@/assets/clouds.png";
import { PlaneSprite } from "@/components/game/PlaneSprite";
import { GROWTH_RATE, formatMultiplier, type Phase } from "@/lib/game";

/** Multiplier tier colours (r,g,b) mirroring Aviator by SPRIBE. */
function trailColor(multiplier: number) {
  if (multiplier < 2) return "52,179,241"; // blue
  if (multiplier < 10) return "145,62,248"; // purple
  return "192,23,180"; // magenta
}


type Props = {
  phase: Phase;
  multiplier: number;
  countdown: number;
  roundNumber: number | null;
};

export function GameCanvas({ phase, multiplier, countdown, roundNumber }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);
  const valueRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({ phase, multiplier, countdown });
  stateRef.current = { phase, multiplier, countdown };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const clouds = new Image();
    clouds.src = cloudsImage;

    let frame = 0;
    let crashAt = 0;
    let spin = 0;
    let cloudOffset = 0;
    let lastPhase: Phase = stateRef.current.phase;

    const render = (time: number) => {
      const { phase: currentPhase, multiplier: currentMultiplier } = stateRef.current;
      if (currentPhase !== lastPhase) {
        if (currentPhase === "flying" || currentPhase === "betting") crashAt = 0;
        if (currentPhase === "crashed") crashAt = time;
        lastPhase = currentPhase;
      }


      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
        canvas.width = width * ratio;
        canvas.height = height * ratio;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const padLeft = 34;
      const padBottom = 30;
      const padTop = 18;
      const padRight = 22;
      const originX = padLeft;
      const originY = height - padBottom;
      const plotW = width - padLeft - padRight;
      const plotH = height - padBottom - padTop;

      /* background motion — rays only spin while the plane is flying, frozen once it flies away */
      if (currentPhase === "flying") spin += 0.0022;
      cloudOffset = (cloudOffset + (currentPhase === "flying" ? 1.4 : 0.7)) % width;

      /* rotating light rays — fan out from a narrow wedge, then stay full once the background is covered */
      if (currentPhase !== "betting") {
        context.save();
        context.translate(originX, originY);
        const step = (Math.PI * 2) / 48;
        const sweep = Math.min(Math.PI * 2, Math.PI / 2 + spin * 4);
        const count = Math.ceil(sweep / step);
        const reach = Math.hypot(width, height) * 2;
        for (let index = 0; index < count; index += 1) {
          const angle = -index * step - spin;
          context.beginPath();
          context.moveTo(0, 0);
          context.lineTo(Math.cos(angle) * reach, Math.sin(angle) * reach);
          context.lineWidth = index % 2 === 0 ? 26 : 10;
          context.strokeStyle = index % 2 === 0 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.022)";
          context.stroke();
        }
        context.restore();
      }

      /* clouds */
      if (clouds.complete) {
        context.save();
        context.globalAlpha = 0.22;
        const cloudH = Math.min(120, plotH * 0.35);
        context.drawImage(clouds, -cloudOffset, originY - cloudH, width, cloudH);
        context.drawImage(clouds, width - cloudOffset, originY - cloudH, width, cloudH);
        context.restore();
      }

      /* axes */
      context.strokeStyle = "rgba(255,255,255,0.16)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(originX, padTop);
      context.lineTo(originX, originY);
      context.lineTo(width - padRight, originY);
      context.stroke();

      const shownMultiplier = currentPhase === "betting" ? 1 : currentMultiplier;
      // Elapsed is derived from the shared multiplier, so every screen/tab shows the same flight.
      const elapsed =
        currentPhase === "betting"
          ? 0
          : Math.max(0, Math.log(Math.max(1, shownMultiplier)) / GROWTH_RATE);
      const timeSpan = Math.max(9, elapsed * 1.22);
      const valueSpan = Math.max(1.45, shownMultiplier * 1.08);
      // Keep the same relative climb on every screen size by reserving room for the plane.
      const planeH = (planeRef.current?.clientHeight ?? 64) * 0.85;
      const usableH = Math.max(plotH * 0.55, plotH - planeH);



      /* axis ticks */
      context.fillStyle = "rgba(255,255,255,0.35)";
      context.font = "10px 'Inter Tight', sans-serif";
      for (let index = 1; index <= 4; index += 1) {
        const value = 1 + ((valueSpan - 1) * index) / 4;
        const y = originY - (usableH * index) / 4;
        context.fillText(`${value.toFixed(1)}x`, 4, y + 3);
        context.beginPath();
        context.arc(originX, y, 1.6, 0, Math.PI * 2);
        context.fill();
      }
      for (let index = 1; index <= 5; index += 1) {
        const x = originX + (plotW * index) / 5;
        context.beginPath();
        context.arc(x, originY, 1.6, 0, Math.PI * 2);
        context.fill();
      }

      /* gentle plane wobble — no container shake */
      const flying = currentPhase === "flying";
      const wobble = flying ? Math.sin(time / 380) * 1.5 : 0;

      /* curve */
      const pointAt = (seconds: number) => {
        const value = Math.exp(GROWTH_RATE * seconds);
        const x = originX + (seconds / timeSpan) * plotW;
        const y = originY - ((value - 1) / (valueSpan - 1)) * usableH;
        return { x, y };
      };

      const tip = pointAt(elapsed);
      if (elapsed > 0.01) {
        const steps = 60;
        const curve = (drawEnd: boolean) => {
          context.beginPath();
          context.moveTo(originX, originY);
          for (let index = 1; index <= steps; index += 1) {
            const point = pointAt((elapsed * index) / steps);
            const ease = index / steps;
            context.lineTo(point.x, point.y);
          }
          if (drawEnd) {
            context.lineTo(tip.x, originY);
            context.closePath();
          }
        };

        /* trail colour follows the multiplier tier, like Aviator by SPRIBE */
        const trail = trailColor(shownMultiplier);

        curve(true);
        const fill = context.createLinearGradient(0, padTop, 0, originY);
        fill.addColorStop(0, `rgba(${trail},0.5)`);
        fill.addColorStop(1, `rgba(${trail},0.04)`);
        context.fillStyle = fill;
        context.fill();

        curve(false);
        context.strokeStyle = `rgba(${trail},${currentPhase === "crashed" ? 0.85 : 1})`;
        context.lineWidth = 3.5;
        context.shadowColor = `rgba(${trail},0.9)`;
        context.shadowBlur = 16;
        context.stroke();
        context.shadowBlur = 0;

      }

      /* plane placement — tail sits on the curve tip, nose lifts gently instead of pointing straight up */
      const plane = planeRef.current;
      if (plane) {
        const anchor = "translate(-4%, -50%)";
      const behind = pointAt(Math.max(0, elapsed - 0.35));
      const raw = (Math.atan2(tip.y - behind.y, Math.max(1, tip.x - behind.x)) * 180) / Math.PI;
      const slopeClimb = Math.max(-14, Math.min(0, raw * 0.45));
      // flatten to horizontal when the plane reaches the top of the graph
      const topBand = 80;
      const closenessToTop = Math.max(0, Math.min(1, (padTop + topBand - tip.y) / topBand));
      const climb = slopeClimb * (1 - closenessToTop);

        if (currentPhase === "crashed") {
          const gone = Math.min(1, (time - crashAt) / 900);
          plane.style.opacity = String(Math.max(0, 1 - gone * 1.15));
          plane.style.transform = `translate(${tip.x + gone * 420}px, ${tip.y - gone * 200}px) rotate(${climb - 4}deg) scale(${1 - gone * 0.3}) ${anchor}`;
        } else if (currentPhase === "betting") {
          plane.style.opacity = "1";
          plane.style.transform = `translate(${originX}px, ${originY}px) rotate(0deg) ${anchor}`;
        } else {
          plane.style.opacity = "1";
          plane.style.transform = `translate(${tip.x}px, ${tip.y}px) rotate(${climb + wobble}deg) ${anchor}`;
        }
      }




      if (valueRef.current) {
        valueRef.current.textContent = formatMultiplier(shownMultiplier);
      }

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, []);

  const crashed = phase === "crashed";

  return (
    <div className="relative h-full min-h-[200px] w-full overflow-hidden rounded-xl border border-border bg-black [contain:layout_paint]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        ref={planeRef}
        className="pointer-events-none absolute left-0 top-0 w-[78px] origin-left will-change-transform sm:w-[104px] lg:w-[124px]"
        style={{ aspectRatio: "1024 / 640" }}
      >
        <PlaneSprite spinning={!crashed} />

      </div>


      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        {phase === "betting" ? (
          <div className="flex flex-col items-center gap-2">
            <span className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Next round in
            </span>
            <span className="font-display text-4xl font-bold text-primary neon-text tabular-nums sm:text-5xl">
              {countdown.toFixed(1)}s
            </span>
            <div className="h-1 w-40 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(100, (1 - countdown / 6) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {crashed ? (
              <span className="font-display text-sm uppercase tracking-[0.35em] text-primary">
                Flew away
              </span>
            ) : null}
            <div
              ref={valueRef}
              className="font-display text-5xl font-bold tabular-nums text-foreground neon-text sm:text-6xl lg:text-7xl"
            >
              1.00x
            </div>
          </div>
        )}
      </div>

      <div className="absolute left-3 top-2 font-display text-[10px] uppercase tracking-widest text-muted-foreground">
        Round #{roundNumber ?? "—"}
      </div>
    </div>
  );
}
