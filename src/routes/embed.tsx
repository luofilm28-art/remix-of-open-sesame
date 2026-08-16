import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { z } from "zod";

import { GameScreen } from "@/components/game/GameScreen";
import { LoadingScreen } from "@/components/game/LoadingScreen";
import { firebaseAuth } from "@/lib/firebase";

export const Route = createFileRoute("/embed")({
  validateSearch: (search) =>
    z.object({ operator: z.string().optional() }).parse(search) as { operator?: string },
  head: () => ({
    meta: [
      { title: "Aviator · Embedded Table" },
      {
        name: "description",
        content:
          "Embedded Aviator crash table for betting platforms — the same live round every player sees, in real time.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Aviator · Embedded Table" },
      { property: "og:description", content: "Embedded Aviator crash table for betting platforms." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmbedPage,
});

function EmbedPage() {
  const [ready, setReady] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const auth = firebaseAuth();
    if (auth.currentUser) {
      setReady(true);
      return;
    }
    void signInAnonymously(auth)
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  if (!ready) return <LoadingScreen />;

  return <GameScreen embedded />;
}
