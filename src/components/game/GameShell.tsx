"use client";

import { useEffect, useRef, useState } from "react";

export function GameShell() {
  const gameParentRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;

    async function bootGame() {
      const parent = gameParentRef.current;
      if (!parent) return;

      const { createLearningGame } = await import("@/game/createLearningGame");
      if (cancelled) return;

      const game = createLearningGame(parent, () => setReady(true));
      dispose = () => game.destroy(true);
    }

    void bootGame();

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <>
      <section
        className="game-shell"
        aria-label="배움마을 교육 게임"
        aria-describedby="game-controls"
      >
        <div ref={gameParentRef} className="game-canvas" />
        <div
          className={`game-loading${ready ? " is-ready" : ""}`}
          aria-hidden={ready}
        >
          <div className="loading-mark">
            <span className="loading-flower" />
            <span>배움마을로 가는 중…</span>
          </div>
        </div>
      </section>
      <p id="game-controls" className="orientation-note">
        가로로 돌리면 더 넓게 플레이할 수 있어요
      </p>
    </>
  );
}
