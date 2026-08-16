import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { BetPanel } from "@/components/game/BetPanel";
import { ChatPanel } from "@/components/game/ChatPanel";
import { GameCanvas } from "@/components/game/GameCanvas";
import { HistoryBar } from "@/components/game/HistoryBar";
import { LiveBets } from "@/components/game/LiveBets";
import { LoadingScreen } from "@/components/game/LoadingScreen";
import { TopBar } from "@/components/game/TopBar";
import { firebaseAuth } from "@/lib/firebase";
import { signOut as firebaseSignOut } from "firebase/auth";
import { formatMultiplier } from "@/lib/game";
import { sound } from "@/lib/sound";
import { DEFAULT_TABLE_CONFIG, resolveTableConfig, type TableConfig } from "@/lib/table-config";
import {
  useChat,
  useGameState,
  useMyBets,
  useProfile,
  useRefresh,
  useRoundBets,
  useSession,
  useTopWins,
} from "@/lib/useGame";

/**
 * The full game screen. Rendered standalone at `/` and inside an operator
 * iframe at `/embed`. Rounds come from the shared deterministic clock, so all
 * players are always on the same round in real time.
 */
export function GameScreen({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const { userId, ready: sessionReady } = useSession({ guest: true });

  const state = useGameState();
  const profile = useProfile(userId);
  const bets = useRoundBets(state.round?.id ?? null, state.multiplier, state.phase);
  const mine = useMyBets(userId);
  const topWins = useTopWins();
  const chat = useChat(state.round?.id ?? null);
  const refresh = useRefresh();

  const [sfxOn, setSfxOn] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [mobileTab, setMobileTab] = useState<"bets" | "chat">("bets");
  const [config, setConfig] = useState<TableConfig>(DEFAULT_TABLE_CONFIG);
  const lastPhase = useRef(state.phase);

  // Money rules come from the embed URL, so each platform can run its own
  // currency, minimum stake and stake increment.
  useEffect(() => {
    setConfig(resolveTableConfig(window.location.search));
  }, []);

  useEffect(() => {
    if (state.phase === lastPhase.current) return;
    if (state.phase === "flying") sound.startEngine();
    if (state.phase === "crashed") {
      sound.stopEngine();
      sound.play("crash");
      toast.error(`Flew away at ${formatMultiplier(state.multiplier)}`, { duration: 2000 });
    }
    lastPhase.current = state.phase;
  }, [state.phase, state.multiplier]);

  useEffect(() => () => sound.stopEngine(), []);

  const signOut = async () => {
    await firebaseSignOut(firebaseAuth());
    void navigate({ to: "/auth", replace: true });
  };

  const ready = sessionReady && Boolean(state.round) && Boolean(profile);
  const bootedOnce = useRef(false);
  if (ready) bootedOnce.current = true;

  if (!bootedOnce.current) return <LoadingScreen />;

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <TopBar
        balance={profile ? Number(profile.balance) : null}
        currency={config.currency}
        username={profile?.username ?? null}
        sfxOn={sfxOn}
        musicOn={musicOn}
        onToggleSfx={() => {
          const next = !sfxOn;
          setSfxOn(next);
          sound.setSfxMuted(!next);
        }}
        onToggleMusic={() => {
          const next = !musicOn;
          setMusicOn(next);
          sound.setMusic(next);
        }}
        onSignOut={embedded ? () => undefined : signOut}
      />

      <div className="grid w-full flex-1 gap-2 overflow-hidden p-2 lg:min-h-0 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        {/* live bets */}
        <div className="order-3 hidden min-h-0 lg:order-2 lg:block lg:h-full">
          <LiveBets roundBets={bets} myBets={mine} topWins={topWins} />
        </div>

        {/* game */}
        <div className="order-1 flex min-h-0 min-w-0 flex-col gap-2 lg:order-3">
          <div className="panel-surface shrink-0">
            <HistoryBar rounds={state.history} />
          </div>

          <div className="min-h-[200px] flex-1">
            <GameCanvas
              phase={state.phase}
              multiplier={state.multiplier}
              countdown={state.countdown}
              roundNumber={state.round?.round_number ?? null}
            />
          </div>

          <div className="grid shrink-0 gap-2 sm:grid-cols-2">
            {[1, 2].map((slot) => (
              <BetPanel
                key={slot}
                slot={slot}
                userId={userId}
                phase={state.phase}
                roundId={state.round?.id ?? null}
                nextRoundId={state.nextRound?.id ?? null}
                multiplier={state.multiplier}
                balance={profile ? Number(profile.balance) : 0}
                signedIn={Boolean(userId)}
                bets={mine}
                onChanged={refresh}
                config={config}
              />
            ))}
          </div>
        </div>

        {/* chat */}
        <div className="order-4 hidden min-h-0 lg:block lg:h-full">
          <ChatPanel
            messages={chat}
            userId={userId}
            onSent={refresh}
            onlineCount={Math.max(1, bets.length + 12)}
          />
        </div>

        {/* mobile panels */}
        <div className="order-2 flex min-h-[340px] flex-col lg:hidden">
          <div className="mb-2 flex gap-1 rounded-full bg-elevated p-0.5">
            {(["bets", "chat"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMobileTab(item)}
                className={`flex-1 rounded-full py-1.5 font-display text-[11px] uppercase tracking-wide ${
                  mobileTab === item ? "bg-secondary text-foreground" : "text-muted-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            {mobileTab === "bets" ? (
              <LiveBets roundBets={bets} myBets={mine} topWins={topWins} />
            ) : (
              <ChatPanel
                messages={chat}
                userId={userId}
                onSent={refresh}
                onlineCount={Math.max(1, bets.length + 12)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
