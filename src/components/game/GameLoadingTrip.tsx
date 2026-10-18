"use client";

import { useEffect, useRef, useState } from "react";

/** Midi leaning into a run, the same picture as on the way to each place. */
const MIDI_SRC = "/assets/characters/midi-v2/player-move-right.webp";
/** The bar, as a share of the 1280 x 720 game: x 290–990. */
const BAR_LEFT = 290 / 1280;
const BAR_WIDTH = 700 / 1280;

/**
 * The first loading screen, in the same style as the trips between places:
 * "이동하는 중..." in the middle of the sky and a bar along the bottom with
 * Midi running on its tip. The real loading has no reliable progress, so the
 * bar eases forward on its own (starting gently) and waits short of full;
 * once the game is ready it glides to the end and the screen fades away.
 */
export function GameLoadingTrip({ ready }: Readonly<{ ready: boolean }>) {
  const fillRef = useRef<HTMLDivElement>(null);
  const runnerRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(ready);
  const [done, setDone] = useState(false);

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    const startedAt = performance.now();
    let shown = 0;
    let readyAt = -1;
    let from = 0;
    let frame = 0;
    let finishedAt = -1;
    const draw = () => {
      const fill = fillRef.current;
      const runner = runnerRef.current;
      if (fill) fill.style.width = `${shown * 100}%`;
      if (runner) runner.style.left = `${(BAR_LEFT + BAR_WIDTH * shown) * 100}%`;
    };
    const step = (now: number) => {
      const t = now - startedAt;
      if (readyAt < 0 && readyRef.current) {
        readyAt = t;
        from = shown;
      }
      if (readyAt < 0) {
        // Starts from rest (no jolt), then slows toward 88%.
        shown = Math.max(shown, 0.88 * (1 - Math.exp(-((t / 1_600) ** 2))));
      } else {
        const u = Math.min(1, (t - readyAt) / 520);
        const eased = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
        shown = from + (1 - from) * eased;
        if (u >= 1 && finishedAt < 0) finishedAt = t;
      }
      draw();
      if (finishedAt >= 0 && t - finishedAt > 140) {
        setDone(true);
        return;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={`game-loading${done ? " is-ready" : ""}`} aria-hidden={done}>
      <span className="loading-title">이동하는 중...</span>
      <div className="loading-track" aria-hidden="true">
        <div ref={fillRef} className="loading-fill" />
      </div>
      <div ref={runnerRef} className="loading-runner" aria-hidden="true">
        <span className="loading-shadow" />
        {/* eslint-disable-next-line @next/next/no-img-element -- a tiny fixed sprite before the game boots */}
        <img className="loading-midi" src={MIDI_SRC} alt="" draggable={false} />
      </div>
    </div>
  );
}
