import Phaser from "phaser";
import { DISPLAY_FONT_FAMILY } from "../../../core/visual/fonts";
import type { VillagePreview } from "../../../core/scenes/villagePreview";
import { FONT_FAMILY } from "../../../core/visual/theme";
import { createGemLights, GEM_SPOTS, GEM_TINTS } from "./introGemLights";
import { MIDI_POSE, type MidiMood, type MidiPose, type MidiSpeechPace, type MidiTalker } from "./introMidiTalker";

/**
 * The bridge from textbook p.101 into the village, played once after
 * "배움마을 입장하기": the nine gems light up and pour their light into the
 * centre, the board opens into a door onto the village, Midi points out the
 * three buildings and the starlight graduation path, then flies through.
 * Tap / Space / Enter advances, Esc or the skip pill skips.
 */
export const INTRO_STORY_STORAGE_KEY = "intam:intro-story-seen:v1";
export const INTRO_STORY_TEXTURES = { village: "intro-story-village", frame: "intro-story-frame" } as const;
/** The village painted live for the door (see VillagePreview). */
const LIVE_VILLAGE_TEXTURE = "intro-story-village-live";
// Midi's face frames are 320 px tall with a 311 px body ending at the frame's pivot.
const FACE_FRAME_BODY_RATIO = 311 / 320;
/**
 * Midi's flight into the door, then the zoom until the village fills the screen
 * (the door and its frame grow with the village, so nothing but village shows
 * inside the frame), then the frame opens out past the screen's corners.
 */
const DOOR_DIVE = { flyMs: 720, zoomMs: 950, openMs: 260, openCover: 1.55 } as const;
// Soft light textures drawn once on a canvas (real blur, not hard outlines).
const LIGHT = { dot: "intro-story-dot", glow: "intro-story-glow", sparkle: "intro-story-sparkle" } as const;

const STORY_DEPTH = { portal: 6, light: 6.5, chip: 9, flash: 10, panel: 20, skip: 21 } as const;
// Door into the village, opened over the gem board. The opening matches the
// ring of the generated frame (story-portal-frame-v1: ring centre 819,479 and
// semi-axes 742 x 389 on a 1639 x 960 canvas), so the mask edge hides under it.
// The title fades when the story starts, so the board rises by BOARD_LIFT and
// the dialogue panel fits under it beside Midi, who never moves.
const BOARD_LIFT = 70;
const PORTAL = { x: 640, y: 280, width: 740, height: 388 } as const;
const PORTAL_FRAME = { ringWidth: 1_484, originX: 819 / 1_639, originY: 479 / 960 } as const;
// The 16:9 village snapshot covers the whole opening.
const VILLAGE_VIEW = { width: 740, height: 416 } as const;
// Kept clear of the bottom edge so it doesn't feel pinned to it on wide windows.
// Just under the lifted board (its frame then ends near y 537), level with
// Midi's body where she stood on the first screen.
const PANEL = { left: 214, right: 1196, y: 592, height: 92 } as const;
const SKIP = { x: 1172, y: 42, width: 132, height: 42 } as const;
// The story reads a little quicker than the intro bubble.
const STORY_PACE: MidiSpeechPace = { letterMs: 41, spaceMs: 32, lineBreakMs: 110, mouthMs: 95 };

const MOODS: readonly MidiMood[] = ["idle", "happy", "surprised", "worried"];
const isMood = (value: MidiMood | MidiPose): value is MidiMood => (MOODS as readonly string[]).includes(value);

type Beat = Readonly<{
  /** Midi's eyes while saying the line. */
  talk: MidiMood;
  /** How Midi stays once the line is said: a resting face, or a whole-body pose. */
  after: MidiMood | MidiPose;
  line: string;
  lineDelayMs: number;
  enter: () => void;
}>;

export function shouldPlayIntroStory(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // ?story always replays it (handy for classroom demos and testing).
    if (new URLSearchParams(window.location.search).has("story")) return true;
    return window.localStorage.getItem(INTRO_STORY_STORAGE_KEY) !== "seen";
  } catch {
    return true;
  }
}

function markIntroStorySeen() {
  try {
    window.localStorage.setItem(INTRO_STORY_STORAGE_KEY, "seen");
  } catch {
    // Storage may be blocked; the story will simply play again next time.
  }
}

/** Draws the soft light textures once per game. */
function ensureLightTextures(scene: Phaser.Scene) {
  const make = (key: string, width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, width, height);
    if (!texture) return;
    draw(texture.getContext());
    texture.refresh();
  };
  make(LIGHT.dot, 48, 48, (ctx) => {
    const gradient = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.6)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 48, 48);
  });
  // A four-point sparkle (thin cross with a bright core).
  make(LIGHT.sparkle, 96, 96, (ctx) => {
    const c = 48;
    const arm = (len: number, width: number, alpha: number) => {
      const g = ctx.createLinearGradient(c - len, c, c + len, c);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(c - len, c - width / 2, len * 2, width);
    };
    arm(46, 6, 1);
    ctx.save(); ctx.translate(c, c); ctx.rotate(Math.PI / 2); ctx.translate(-c, -c); arm(46, 6, 1); ctx.restore();
    ctx.save(); ctx.translate(c, c); ctx.rotate(Math.PI / 4); ctx.translate(-c, -c); arm(22, 3, 0.7); ctx.restore();
    ctx.save(); ctx.translate(c, c); ctx.rotate(-Math.PI / 4); ctx.translate(-c, -c); arm(22, 3, 0.7); ctx.restore();
    const core = ctx.createRadialGradient(c, c, 0, c, c, 12);
    core.addColorStop(0, "rgba(255,255,255,1)");
    core.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, 96, 96);
  });
  make(LIGHT.glow, 256, 256, (ctx) => {
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.25, "rgba(220,245,255,0.75)");
    gradient.addColorStop(0.6, "rgba(170,225,255,0.22)");
    gradient.addColorStop(1, "rgba(170,225,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  });
}

export type IntroStoryOptions = Readonly<{
  board: Phaser.GameObjects.Image;
  rays?: Phaser.GameObjects.Container;
  mascot: Phaser.GameObjects.Container;
  talker: MidiTalker;
  reducedMotion: boolean;
  /** Midi's frame height on this screen (her face frames are 320 px with a 311 px body). */
  mascotFrameHeight: number;
  /** Paints the real village for the door; without it the saved snapshot is shown. */
  villagePreview?: VillagePreview;
  renderScale: number;
  /** Called once Midi has flown through the door; start the village from here. */
  onFinish: () => void;
}>;

export function playIntroStory(scene: Phaser.Scene, options: IntroStoryOptions) {
  const { board, talker, mascot } = options;
  const calm = options.reducedMotion;
  const motion = (ms: number) => (calm ? 0 : ms);
  ensureLightTextures(scene);
  const extras: Phaser.GameObjects.GameObject[] = [];
  const track = <T extends Phaser.GameObjects.GameObject>(object: T) => {
    extras.push(object);
    return object;
  };
  const particles = (x: number, y: number, config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig) =>
    track(scene.add.particles(x, y, LIGHT.dot, { blendMode: Phaser.BlendModes.ADD, ...config })).setDepth(STORY_DEPTH.light);

  // Midi stays exactly where she was; the board rises into the title's place.
  const boardY = board.y - BOARD_LIFT;
  scene.tweens.add({ targets: board, y: boardY, duration: motion(420), ease: "Sine.easeInOut" });

  // --- Light gathering in the middle of the board ------------------------------
  // Centre of the gem cluster, where the gems' light gathers.
  const gather = { x: board.x, y: boardY + board.displayHeight * 0.02 };
  const core = track(scene.add.image(gather.x, gather.y, LIGHT.glow))
    .setDepth(STORY_DEPTH.light).setBlendMode(Phaser.BlendModes.ADD).setScale(0).setAlpha(0);

  // --- Door into the village ---------------------------------------------------
  const maskShape = scene.make.graphics({ x: PORTAL.x, y: PORTAL.y });
  maskShape.fillStyle(0xffffff, 1).fillEllipse(0, 0, PORTAL.width, PORTAL.height);
  maskShape.setScale(0);
  // The real village, drawn now from its own layout (so it always matches the
  // village scene); the saved snapshot is only a fallback.
  const villageTexture = options.villagePreview?.paint(scene, LIVE_VILLAGE_TEXTURE, options.renderScale)
    ? LIVE_VILLAGE_TEXTURE
    : INTRO_STORY_TEXTURES.village;
  const village = track(scene.add.image(PORTAL.x, PORTAL.y, villageTexture))
    .setDisplaySize(VILLAGE_VIEW.width, VILLAGE_VIEW.height)
    .setDepth(STORY_DEPTH.portal)
    .setVisible(false);
  const villageScale = village.scaleX;
  if (scene.game.renderer.type === Phaser.CANVAS) {
    village.setMask(maskShape.createGeometryMask());
  } else {
    village.enableFilters();
    village.filters?.external.addMask(maskShape, false, scene.cameras.main, "world");
  }
  // Generated door frame: a glowing ring with three gems.
  const ring = track(scene.add.image(PORTAL.x, PORTAL.y, INTRO_STORY_TEXTURES.frame))
    .setOrigin(PORTAL_FRAME.originX, PORTAL_FRAME.originY)
    .setDepth(STORY_DEPTH.portal + 0.2)
    .setVisible(false);
  const ringScale = PORTAL.width / PORTAL_FRAME.ringWidth;
  ring.setScale(0);
  // Motes drift around the rim of the open door.
  const rimMotes = particles(PORTAL.x, PORTAL.y, {
    emitting: false,
    lifespan: { min: 700, max: 1_300 },
    speed: { min: 4, max: 18 },
    scale: { start: 0.5, end: 0 },
    alpha: { start: 0.95, end: 0 },
    tint: [0xffffff, 0xbdeeff, 0xd9ccff],
    frequency: 60,
    quantity: 1,
    // Born exactly on the rim, so nothing floats over the village itself.
    emitZone: { type: "edge", source: new Phaser.Geom.Ellipse(0, 0, PORTAL.width, PORTAL.height), quantity: 90 },
  });
  const gemShines: Phaser.GameObjects.GameObject[] = [];
  const gemLights = createGemLights(scene, {
    board, boardY, depth: STORY_DEPTH.light - 0.2, calm, track, sparkleKey: LIGHT.sparkle,
  });
  gemShines.push(...gemLights.objects);
  let portalOpen = false;
  const openPortal = (instant = false) => {
    if (portalOpen) return;
    portalOpen = true;
    const ms = instant ? 0 : motion(820);
    village.setVisible(true).setScale(villageScale * 1.15);
    ring.setVisible(true);
    scene.tweens.add({ targets: maskShape, scale: 1, duration: ms, ease: "Cubic.easeOut" });
    scene.tweens.add({ targets: ring, scale: ringScale, duration: ms, ease: "Cubic.easeOut" });
    scene.tweens.add({ targets: village, scale: villageScale, duration: instant ? 0 : motion(1_500), ease: "Sine.easeOut" });
    scene.tweens.killTweensOf(core);
    scene.tweens.add({ targets: core, alpha: 0, scale: 6, duration: instant ? 0 : motion(700), ease: "Cubic.easeOut" });
    if (!calm) {
      scene.time.delayedCall(ms, () => rimMotes.start());
      scene.tweens.add({ targets: ring, alpha: { from: 1, to: 0.86 }, delay: ms, duration: 1_100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
    // The gem lights and the board dissolve into the door.
    gemLights.stop();
    scene.tweens.killTweensOf(gemShines);
    scene.tweens.add({ targets: gemShines, alpha: 0, duration: instant ? 0 : motion(300) });
    scene.tweens.killTweensOf(board);
    scene.tweens.add({
      targets: board, alpha: 0, scaleX: board.scaleX * 0.94, scaleY: board.scaleY * 0.94,
      duration: instant ? 0 : motion(520), ease: "Sine.easeIn",
    });
  };

  // --- Dialogue panel ---------------------------------------------------------------
  const panelWidth = PANEL.right - PANEL.left;
  const panelX = PANEL.left + panelWidth / 2;
  const panelPlate = scene.add.graphics();
  panelPlate.fillStyle(0x2b3f86, 0.18).fillRoundedRect(-panelWidth / 2 + 3, -PANEL.height / 2 + 6, panelWidth, PANEL.height, 24);
  panelPlate.fillStyle(0xffffff, 0.97).fillRoundedRect(-panelWidth / 2, -PANEL.height / 2, panelWidth, PANEL.height, 24);
  panelPlate.lineStyle(3, 0xc9c2ec, 1).strokeRoundedRect(-panelWidth / 2, -PANEL.height / 2, panelWidth, PANEL.height, 24);
  // Little tail toward Midi on the left.
  panelPlate.fillStyle(0xffffff, 1).fillTriangle(-panelWidth / 2 + 1.5, -14, -panelWidth / 2 + 1.5, 10, -panelWidth / 2 - 16, 4);
  panelPlate.lineStyle(3, 0xc9c2ec, 1).lineBetween(-panelWidth / 2, -14, -panelWidth / 2 - 16, 4);
  panelPlate.lineBetween(-panelWidth / 2 - 16, 4, -panelWidth / 2, 10);
  const nameTag = scene.add.graphics();
  nameTag.fillStyle(0x4b8fe0, 1).fillRoundedRect(-panelWidth / 2 + 26, -PANEL.height / 2 - 16, 82, 32, 16);
  const nameText = scene.add
    .text(-panelWidth / 2 + 67, -PANEL.height / 2, "미디", { fontFamily: DISPLAY_FONT_FAMILY, fontSize: "19px", color: "#ffffff" })
    .setOrigin(0.5).setResolution(3);
  // One line that wraps only when it runs out of room.
  const lineText = scene.add
    .text(-panelWidth / 2 + 40, 0, "", {
      fontFamily: FONT_FAMILY, fontSize: "24px", fontStyle: "bold", color: "#2f3d68", lineSpacing: 10,
    })
    .setResolution(3);
  const lineWidth = panelWidth - 110;
  const nextArrow = scene.add.graphics();
  nextArrow.fillStyle(0x4b8fe0, 1).fillTriangle(-9, -5, 9, -5, 0, 6);
  nextArrow.setPosition(panelWidth / 2 - 34, PANEL.height / 2 - 24).setVisible(false);
  // How to go on, next to the arrow (the village later shows the arrow alone).
  const nextHint = scene.add
    .text(panelWidth / 2 - 52, PANEL.height / 2 - 24, "화면 터치 또는 Space", {
      fontFamily: FONT_FAMILY, fontSize: "15px", fontStyle: "bold", color: "#7a86b8",
    })
    .setOrigin(1, 0.5)
    .setResolution(3)
    .setVisible(false);
  const panel = track(scene.add.container(panelX, PANEL.y, [panelPlate, nameTag, nameText, lineText, nextHint, nextArrow]))
    .setDepth(STORY_DEPTH.panel).setAlpha(0);
  scene.tweens.add({ targets: panel, alpha: 1, y: { from: PANEL.y + 24, to: PANEL.y }, duration: motion(320), ease: "Cubic.easeOut" });
  if (!calm) {
    scene.tweens.add({ targets: nextArrow, y: nextArrow.y + 5, duration: 420, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  // --- Skip pill ----------------------------------------------------------------------
  const skipPlate = scene.add.graphics();
  skipPlate.fillStyle(0xffffff, 0.86).fillRoundedRect(-SKIP.width / 2, -SKIP.height / 2, SKIP.width, SKIP.height, SKIP.height / 2);
  skipPlate.lineStyle(2, 0xc9c2ec, 1).strokeRoundedRect(-SKIP.width / 2, -SKIP.height / 2, SKIP.width, SKIP.height, SKIP.height / 2);
  const skipText = scene.add
    .text(-8, 0, "건너뛰기", { fontFamily: FONT_FAMILY, fontSize: "17px", fontStyle: "bold", color: "#2f3d68" })
    .setOrigin(0.5).setResolution(3);
  const arrowX = skipText.x + skipText.width / 2 + 8;
  const skipArrows = scene.add.graphics();
  skipArrows.fillStyle(0x4b8fe0, 1)
    .fillTriangle(arrowX, -6, arrowX, 6, arrowX + 8, 0)
    .fillTriangle(arrowX + 8, -6, arrowX + 8, 6, arrowX + 16, 0);
  const skip = track(scene.add.container(SKIP.x, SKIP.y, [skipPlate, skipText, skipArrows]))
    .setDepth(STORY_DEPTH.skip)
    .setSize(SKIP.width, SKIP.height)
    .setAlpha(0)
    .setInteractive({ useHandCursor: true });
  scene.tweens.add({ targets: skip, alpha: 1, delay: motion(400), duration: motion(300) });

  // --- Beats ----------------------------------------------------------------------------
  const boardPoint = (spot: readonly [number, number]) => ({
    x: board.x + spot[0] * board.displayWidth,
    y: boardY + spot[1] * board.displayHeight,
  });
  const beats: Beat[] = [
    {
      // Each gem lights up in turn and sends its light to the middle of the board.
      talk: "surprised",
      after: "surprised",
      line: "어? 보석들이 하나씩 빛나기 시작했어.",
      lineDelayMs: 450,
      enter: () => {
        talker.setMood("surprised");
        // The collected gems power up one by one (they are already bright:
        // each beats, flashes in its own shape and keeps a glowing rim).
        GEM_SPOTS.forEach((spot, index) => {
          const gem = boardPoint(spot);
          // After the board has finished rising, so the gem copies sit on it.
          const delay = motion(480 + index * 150);
          const tint = GEM_TINTS[index % GEM_TINTS.length];
          gemLights.light(index, delay);
          if (calm) return;
          scene.time.delayedCall(delay, () => {
            const burst = particles(gem.x, gem.y, {
              emitting: false, lifespan: { min: 380, max: 700 }, speed: { min: 40, max: 130 },
              scale: { start: 0.32, end: 0 }, alpha: { start: 1, end: 0 }, tint: [0xffffff, tint],
            });
            burst.explode(6);
          });
        });
        // Once all nine are on, they beat together and their light gathers
        // in the middle of the board.
        // Right after the last gem lights, so there is no pause that looks like the end.
        const allOnMs = motion(480 + GEM_SPOTS.length * 150 + 200);
        gemLights.beatAll(allOnMs);
        if (calm) return;
        GEM_SPOTS.forEach((spot, index) => {
          const gem = boardPoint(spot);
          scene.time.delayedCall(allOnMs + 120, () => {
            if (portalOpen) return;
            const orb = track(scene.add.image(gem.x, gem.y, LIGHT.dot))
              .setDepth(STORY_DEPTH.light).setBlendMode(Phaser.BlendModes.ADD).setScale(0.2).setTint(GEM_TINTS[index]);
            const trail = particles(0, 0, {
              follow: orb, lifespan: 380, speed: 6, scale: { start: 0.32, end: 0 }, alpha: { start: 0.8, end: 0 },
              frequency: 24, tint: [0xffffff, GEM_TINTS[index]],
            });
            scene.tweens.add({ targets: orb, scale: 0.75, duration: 180, ease: "Sine.easeOut" });
            scene.tweens.add({
              targets: orb, x: gather.x, y: gather.y, duration: 620, delay: 80, ease: "Sine.easeIn",
              onComplete: () => {
                orb.setVisible(false);
                trail.stop();
                // Late orbs (after a quick tap) must not relight the core over the open door.
                if (portalOpen) return;
                scene.tweens.add({ targets: core, scale: `+=${0.06}`, alpha: Math.min(0.8, 0.2 + index * 0.07), duration: 160 });
              },
            });
          });
        });
      },
    },
    {
      // The gathered light bursts, and the board opens into a door.
      // A big happy smile for the open door (no arms-up pose).
      talk: "happy",
      after: "happy",
      line: "보석의 힘으로 배움마을로 갈 수 있는 문이 열렸어!",
      lineDelayMs: 1_000,
      enter: () => {
        scene.tweens.killTweensOf(core);
        scene.tweens.add({ targets: core, scale: 2.4, alpha: 1, duration: motion(320), ease: "Cubic.easeIn" });
        const flash = track(scene.add.rectangle(640, 360, 1280, 720, 0xffffff, 0))
          .setDepth(STORY_DEPTH.flash);
        scene.tweens.add({ targets: flash, fillAlpha: 0.9, delay: motion(260), duration: motion(140), yoyo: true, hold: motion(90), ease: "Sine.easeOut" });
        if (options.rays) {
          scene.tweens.killTweensOf(options.rays);
          scene.tweens.add({ targets: options.rays, alpha: 1, scale: 1.18, duration: motion(900), ease: "Sine.easeOut" });
        }
        scene.time.delayedCall(motion(330), () => {
          openPortal();
          if (calm) return;
          const burst = particles(PORTAL.x, PORTAL.y, {
            emitting: false, lifespan: { min: 600, max: 1_100 }, speed: { min: 180, max: 520 },
            scale: { start: 0.9, end: 0 }, alpha: { start: 1, end: 0 }, tint: [0xffffff, 0xbdeeff, 0xfff2a8],
          });
          burst.explode(46);
        });
      },
    },
    {
      // Waves the student along, then flies off through the door.
      talk: "happy",
      after: MIDI_POSE.wave,
      line: "자, 나를 따라와!",
      lineDelayMs: 150,
      enter: () => openPortal(true),
    },
  ];

  // --- Flow ------------------------------------------------------------------------------
  let beatIndex = -1;
  let lineReady = false;
  let finishing = false;
  const render = (visible: string) => lineText.setText(visible);
  /** Breaks the full line where it would wrap, so letters never jump lines while typing. */
  const layoutLine = (line: string) => {
    lineText.setWordWrapWidth(lineWidth, false);
    const wrapped = lineText.getWrappedText(line).join("\n");
    lineText.setWordWrapWidth(null);
    lineText.setText(wrapped);
    lineText.setY(4 - lineText.height / 2);
    lineText.setText("");
    return wrapped;
  };
  const nextBeat = () => {
    beatIndex += 1;
    if (beatIndex >= beats.length) {
      finish();
      return;
    }
    const beat = beats[beatIndex];
    lineReady = false;
    nextArrow.setVisible(false);
    nextHint.setVisible(false);
    lineText.setText("");
    beat.enter();
    scene.time.delayedCall(motion(beat.lineDelayMs), () => {
      if (finishing) return;
      talker.say(layoutLine(beat.line), render, () => {
        if (isMood(beat.after)) talker.setMood(beat.after);
        else talker.setPose(beat.after);
        lineReady = true;
        nextArrow.setVisible(true);
        nextHint.setVisible(true);
      }, STORY_PACE, beat.talk);
    });
  };
  const advance = () => {
    if (finishing) return;
    if (talker.isTalking()) {
      talker.finish();
      return;
    }
    if (lineReady) nextBeat();
  };
  const finish = () => {
    if (finishing) return;
    finishing = true;
    markIntroStorySeen();
    talker.stop();
    talker.setPose(MIDI_POSE.fly);
    removeInput();
    openPortal(true);
    skip.disableInteractive();
    scene.tweens.add({ targets: [panel, skip], alpha: 0, duration: motion(220) });
    // Midi flies into the door and lands where she starts in the village, already
    // at the village's size inside the door; then the village grows until it
    // fills the screen exactly as the village scene draws it (Midi grows with
    // it), so the switch to the village is invisible.
    scene.tweens.killTweensOf(mascot);
    scene.tweens.killTweensOf(village);
    rimMotes.stop();
    const preview = options.villagePreview;
    const mapSize = preview?.size ?? { width: 1280, height: 720 };
    const screen = { x: 640, y: 360 };
    // The village's picture as it sits in the door right now.
    const view = { x: village.x, y: village.y, kx: village.displayWidth / mapSize.width, ky: village.displayHeight / mapSize.height };
    const inDoor = (point: Readonly<{ x: number; y: number }>) => ({
      x: view.x + (point.x - mapSize.width / 2) * view.kx,
      y: view.y + (point.y - mapSize.height / 2) * view.ky,
    });
    const shadow = mascot.list[0] as Phaser.GameObjects.Ellipse | undefined;
    if (shadow) scene.tweens.add({ targets: shadow, alpha: 0, duration: motion(300) });
    // Where (and how big) Midi stands in the village once it fills the screen.
    const bodyHeight = options.mascotFrameHeight * FACE_FRAME_BODY_RATIO;
    const landing = preview
      ? {
        x: preview.spawn.x,
        y: preview.spawn.y + preview.midiBody.bottomBelowSpawn,
        scale: preview.midiBody.height / bodyHeight,
      }
      : { x: screen.x, y: screen.y + 120, scale: 0.6 };
    const landingInDoor = inDoor(landing);
    scene.tweens.add({
      targets: mascot, x: landingInDoor.x, y: landingInDoor.y, scale: landing.scale * view.kx,
      duration: motion(DOOR_DIVE.flyMs), ease: "Sine.easeInOut",
      onComplete: () => {
        // She arrives facing front, as she stands in the village.
        talker.setPose(undefined);
        talker.setMood("idle");
      },
    });
    const zoom = { delay: motion(DOOR_DIVE.flyMs), duration: motion(DOOR_DIVE.zoomMs), ease: "Cubic.easeInOut" };
    const fullScale = { x: village.scaleX / view.kx, y: village.scaleY / view.ky };
    scene.tweens.add({ targets: village, x: screen.x, y: screen.y, scaleX: fullScale.x, scaleY: fullScale.y, ...zoom });
    // The door grows exactly as much as the village, so the opening always shows
    // village (never the empty background), with the frame still around it.
    const grow = fullScale.x / village.scaleX;
    scene.tweens.killTweensOf(ring);
    scene.tweens.add({ targets: maskShape, x: screen.x, y: screen.y, scale: maskShape.scale * grow, ...zoom });
    scene.tweens.add({ targets: ring, x: screen.x, y: screen.y, scale: ring.scaleX * grow, alpha: 1, ...zoom });
    // Now the village fills the screen: the frame opens out past the corners and fades.
    const open = { delay: zoom.delay + zoom.duration, duration: motion(DOOR_DIVE.openMs), ease: "Sine.easeOut" };
    scene.tweens.add({ targets: maskShape, scale: maskShape.scale * grow * DOOR_DIVE.openCover, ...open });
    scene.tweens.add({ targets: ring, scale: ring.scaleX * grow * DOOR_DIVE.openCover, alpha: 0, ...open });
    // Same easing and timing as the village, so she stays on her spot in it.
    scene.tweens.add({ targets: mascot, x: landing.x, y: landing.y, scale: landing.scale, ...zoom });
    scene.time.delayedCall(motion(DOOR_DIVE.flyMs + DOOR_DIVE.zoomMs + DOOR_DIVE.openMs) + 30, () => options.onFinish());
  };

  const onPointer = () => advance();
  const onKey = (event: KeyboardEvent) => {
    event.preventDefault();
    advance();
  };
  const onEscape = () => finish();
  const removeInput = () => {
    scene.input.off("pointerdown", onPointer);
    scene.input.keyboard?.off("keydown-SPACE", onKey);
    scene.input.keyboard?.off("keydown-ENTER", onKey);
    scene.input.keyboard?.off("keydown-ESC", onEscape);
  };
  skip.on(
    "pointerdown",
    (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      finish();
    },
  );
  scene.input.on("pointerdown", onPointer);
  scene.input.keyboard?.on("keydown-SPACE", onKey);
  scene.input.keyboard?.on("keydown-ENTER", onKey);
  scene.input.keyboard?.on("keydown-ESC", onEscape);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    removeInput();
    maskShape.destroy();
    for (const object of extras) object.destroy();
  });

  nextBeat();
}
