import Phaser from "phaser";
import { GAME_SIZE } from "../../../assets";

export type EndingCameraFailure = "denied" | "missing" | "busy" | "unsupported";
export type EndingCameraStart = Readonly<{ ok: true }> | Readonly<{ ok: false; reason: EndingCameraFailure }>;

type Rect = Readonly<{ x: number; y: number; width: number; height: number }>;

/**
 * The selfie camera for the certificate photo. Nothing leaves the device:
 * the live picture is a <video> laid exactly over the photo slot (the game
 * canvas cannot draw a live camera itself), a capture is one frame drawn to
 * a canvas, and the camera is switched off the moment it is not needed.
 */
export function createEndingCamera(
  scene: Phaser.Scene,
  options: Readonly<{
    /** The photo slot in game pixels. */
    slot: () => Rect;
    /** Called when the camera stops by itself (tab hidden, device unplugged). */
    onInterrupted: () => void;
  }>,
) {
  let stream: MediaStream | undefined;
  let video: HTMLVideoElement | undefined;

  const layout = () => {
    if (!video) return;
    const bounds = scene.game.canvas.getBoundingClientRect();
    const kx = bounds.width / GAME_SIZE.width;
    const ky = bounds.height / GAME_SIZE.height;
    const slot = options.slot();
    Object.assign(video.style, {
      left: `${bounds.left + slot.x * kx}px`,
      top: `${bounds.top + slot.y * ky}px`,
      width: `${slot.width * kx}px`,
      height: `${slot.height * ky}px`,
      borderRadius: `${12 * kx}px`,
    });
  };

  const stop = () => {
    stream?.getTracks().forEach((track) => track.stop());
    stream = undefined;
    if (video) {
      video.srcObject = null;
      video.remove();
      video = undefined;
    }
    window.removeEventListener("resize", layout);
    window.removeEventListener("scroll", layout, true);
    scene.scale.off(Phaser.Scale.Events.RESIZE, layout);
  };

  const onHidden = () => {
    if (document.visibilityState !== "hidden" || !stream) return;
    stop();
    options.onInterrupted();
  };
  document.addEventListener("visibilitychange", onHidden);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    stop();
    document.removeEventListener("visibilitychange", onHidden);
  });

  return {
    isOn: () => Boolean(stream),

    /** Asks for the front camera (only ever from a tap) and shows it over the slot. */
    async start(): Promise<EndingCameraStart> {
      if (stream) return { ok: true };
      if (!navigator.mediaDevices?.getUserMedia) return { ok: false, reason: "unsupported" };
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
      } catch (error) {
        const name = error instanceof DOMException ? error.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") return { ok: false, reason: "denied" };
        if (name === "NotReadableError" || name === "AbortError") return { ok: false, reason: "busy" };
        if (name === "NotFoundError" || name === "OverconstrainedError") return { ok: false, reason: "missing" };
        return { ok: false, reason: "unsupported" };
      }
      if (!scene.sys.isActive()) {
        stop();
        return { ok: false, reason: "unsupported" };
      }
      stream.getVideoTracks().forEach((track) => track.addEventListener("ended", () => {
        if (!stream) return;
        stop();
        options.onInterrupted();
      }));
      video = document.createElement("video");
      video.setAttribute("playsinline", "");
      video.setAttribute("aria-label", "카메라 미리보기");
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      Object.assign(video.style, {
        position: "fixed",
        objectFit: "cover",
        // A mirror, like looking into a selfie camera.
        transform: "scaleX(-1)",
        pointerEvents: "none",
        zIndex: "20",
        background: "#dfe6f5",
      });
      video.srcObject = stream;
      document.body.appendChild(video);
      layout();
      window.addEventListener("resize", layout);
      window.addEventListener("scroll", layout, true);
      scene.scale.on(Phaser.Scale.Events.RESIZE, layout);
      try {
        await video.play();
      } catch {
        // Autoplay of a muted inline video is allowed; if not, the first frame still shows.
      }
      return { ok: true };
    },

    /** One mirrored, square frame of the live picture (as the preview shows it). */
    capture(): HTMLCanvasElement | undefined {
      if (!video || !video.videoWidth) return undefined;
      const side = Math.min(video.videoWidth, video.videoHeight);
      const canvas = document.createElement("canvas");
      canvas.width = side;
      canvas.height = side;
      const ctx = canvas.getContext("2d");
      if (!ctx) return undefined;
      ctx.translate(side, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(
        video,
        (video.videoWidth - side) / 2,
        (video.videoHeight - side) / 2,
        side,
        side,
        0,
        0,
        side,
        side,
      );
      return canvas;
    },

    stop,
  };
}
