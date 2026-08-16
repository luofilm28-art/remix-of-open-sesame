import planeImage from "@/assets/plane.png";

/**
 * Plane artwork facing forward (nose to the right) with a live spinning propeller.
 * Shared by the game canvas, the header logo and the loading screen.
 */
export function PlaneSprite({
  className = "",
  spinning = true,
}: {
  className?: string;
  spinning?: boolean;
}) {
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: "1024 / 640" }}>
      <img
        src={planeImage}
        alt="Aviator plane in flight"
        width={1024}
        height={640}
        className="h-full w-full -scale-x-100"
        style={{ filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.55))" }}
      />
      <span
        className="absolute"
        style={{
          left: "88%",
          top: "42%",
          width: "9%",
          height: "58%",
          transform: "translate(-50%, -50%)",
          animation: spinning ? "propeller-spin 0.09s linear infinite" : "none",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(40,40,40,0.85), rgba(255,255,255,0.05))",
          borderRadius: "999px",
        }}
      />
    </div>
  );
}
