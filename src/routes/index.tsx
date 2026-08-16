import { createFileRoute } from "@tanstack/react-router";

import { GameScreen } from "@/components/game/GameScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aviator Crash Game · Live Multiplier Table" },
      {
        name: "description",
        content:
          "Play the Aviator-style crash game: watch the plane climb, cash out before it flies away, chase multipliers with live bets, chat and provably fair rounds.",
      },
      { property: "og:title", content: "Aviator Crash Game · Live Multiplier Table" },
      {
        property: "og:description",
        content:
          "Live crash rounds with real-time multipliers, auto bet, auto cash out, live player feed and chat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  return <GameScreen />;
}
