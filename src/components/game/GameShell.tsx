"use client";

import type Phaser from "phaser";
import { useEffect, useRef, useState } from "react";

type NextDevelopmentWindow = Window &
  typeof globalThis & {
    __NEXT_HMR_LATENCY_CB?: (latencyMs: number) => void;
  };

const DEVELOPMENT_SCENE_STORAGE_KEY = "intam:development-scene";

function readDevelopmentScene() {
  if (process.env.NODE_ENV !== "development") return undefined;

  try {
    return window.sessionStorage.getItem(DEVELOPMENT_SCENE_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

/** `?ending` opens the ending straight away (for checking it and classroom demos). */
function readRequestedEnding() {
  try {
    return new URLSearchParams(window.location.search).has("ending");
  } catch {
    return false;
  }
}

function rememberDevelopmentScene(sceneKey?: string) {
  if (
    process.env.NODE_ENV !== "development" ||
    !sceneKey ||
    sceneKey === "intro"
  ) {
    return;
  }

  try {
    window.sessionStorage.setItem(DEVELOPMENT_SCENE_STORAGE_KEY, sceneKey);
  } catch {
    // Some privacy modes can disable session storage; Fast Refresh still works.
  }
}

export function GameShell() {
  const gameParentRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let activeGame: Phaser.Game | undefined;
    let reloadQueued = false;
    const developmentWindow = window as NextDevelopmentWindow;
    const previousHmrCallback = developmentWindow.__NEXT_HMR_LATENCY_CB;

    function getActiveSceneKey() {
      return activeGame?.scene.getScenes(true)[0]?.scene.key;
    }

    function rememberActiveScene() {
      rememberDevelopmentScene(getActiveSceneKey());
    }

    async function bootGame() {
      const parent = gameParentRef.current;
      if (!parent) return;

      const sceneToRestore = readDevelopmentScene();

      const [{ createLearningGame }, { loadGameFonts }] = await Promise.all([
        import("@/game/createLearningGame"),
        import("@/game/core/visual/fonts"),
      ]);
      await loadGameFonts();
      if (cancelled) return;

      const nextGame = createLearningGame(parent, () => {
        if (cancelled) return;
        if (readRequestedEnding()) {
          nextGame.scene.stop("intro");
          nextGame.scene.start("ending");
        } else if (sceneToRestore && sceneToRestore !== "intro") {
          nextGame.scene.start(sceneToRestore);
        }
        setReady(true);
      });
      activeGame = nextGame;
    }

    void bootGame();

    if (process.env.NODE_ENV === "development") {
      window.addEventListener("beforeunload", rememberActiveScene);
      developmentWindow.__NEXT_HMR_LATENCY_CB = (latencyMs) => {
        previousHmrCallback?.(latencyMs);
        if (reloadQueued) return;

        reloadQueued = true;
        rememberActiveScene();
        // Turbopack removes the previous async game module during HMR. Reloading
        // once lets the browser import only the replacement module instead of
        // racing the deleted one, while session storage restores the same scene.
        window.setTimeout(() => window.location.reload(), 0);
      };
    }

    return () => {
      cancelled = true;
      rememberActiveScene();
      window.removeEventListener("beforeunload", rememberActiveScene);
      activeGame?.destroy(true);
      if (
        developmentWindow.__NEXT_HMR_LATENCY_CB !== previousHmrCallback
      ) {
        developmentWindow.__NEXT_HMR_LATENCY_CB = previousHmrCallback;
      }
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
          <div className="loading-card">
            <span className="loading-title">AI 월드 탐험가</span>
            <span className="loading-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="loading-text">배움마을로 가는 중…</span>
          </div>
        </div>
      </section>
      <p id="game-controls" className="orientation-note">
        가로로 돌리면 더 넓게 플레이할 수 있어요
      </p>
    </>
  );
}
