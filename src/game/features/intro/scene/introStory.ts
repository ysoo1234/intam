import Phaser from "phaser";
import { DISPLAY_FONT_FAMILY } from "../../../core/visual/fonts";
import { WORLD_EXIT_REQUIRED_STARS } from "../../../core/navigation";
import { FONT_FAMILY } from "../../../core/visual/theme";
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
// Soft light textures drawn once on a canvas (real blur, not hard outlines).
const LIGHT = { dot: "intro-story-dot", glow: "intro-story-glow" } as const;

const STORY_DEPTH = { portal: 6, light: 6.5, chip: 9, flash: 10, panel: 20, skip: 21 } as const;
// Door into the village, opened over the gem board. The opening matches the
// ring of the generated frame (story-portal-frame-v1: ring centre 819,479 and
// semi-axes 742 x 389 on a 1639 x 960 canvas), so the mask edge hides under it.
const PORTAL = { x: 640, y: 330, width: 740, height: 388 } as const;
const PORTAL_FRAME = { ringWidth: 1_484, originX: 819 / 1_639, originY: 479 / 960 } as const;
// The 16:9 village snapshot covers the whole opening.
const VILLAGE_VIEW = { width: 740, height: 416 } as const;
// Kept clear of the bottom edge so it doesn't feel pinned to it on wide windows.
const PANEL = { left: 214, right: 1196, y: 606, height: 104 } as const;
const SKIP = { x: 1172, y: 42, width: 132, height: 42 } as const;
// During the story Midi stands lower, beside the dialogue panel.
const STORY_MIDI = { x: 118, y: 684 } as const;
// The story reads a little quicker than the intro bubble.
const STORY_PACE: MidiSpeechPace = { letterMs: 45, spaceMs: 35, lineBreakMs: 120, mouthMs: 95 };

// Gem centres on the board artwork, as a fraction of the board's width and
// height measured from its centre (board art is 1448 x 1086).
const GEM_SPOTS = [
  [-0.007, -0.249], [-0.177, -0.142], [0.166, -0.142],
  [-0.007, -0.036], [-0.177, 0.075], [0.166, 0.075],
  [-0.007, 0.185], [-0.177, 0.292], [0.166, 0.292],
] as const;
// Spots on the village snapshot as a fraction of its size (0..1 from the top left).
const VILLAGE_SPOTS = {
  // Top of each roof, where the name label points.
  workshop: { x: 0.202, y: 0.515 },
  airport: { x: 0.195, y: 0.035 },
  ethics: { x: 0.805, y: 0.54 },
  // Top of the graduation-path gate (raised so the label clears the frame's
  // top gem), and its swirling opening.
  gateTop: { x: 0.78, y: 0 },
  gateOpening: { x: 0.83, y: 0.245, width: 0.075, height: 0.27 },
} as const;

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
  /** Called once Midi has flown through the door; start the village from here. */
  onFinish: () => void;
}>;

export function playIntroStory(scene: Phaser.Scene, options: IntroStoryOptions) {
  const { board, talker, mascot } = options;
  const calm = options.reducedMotion;
  const motion = (ms: number) => (calm ? 0 : ms);
  ensureLightTextures(scene);
  const villagePoint = (spot: Readonly<{ x: number; y: number }>) => ({
    x: PORTAL.x + (spot.x - 0.5) * VILLAGE_VIEW.width,
    y: PORTAL.y + (spot.y - 0.5) * VILLAGE_VIEW.height,
  });
  const extras: Phaser.GameObjects.GameObject[] = [];
  const track = <T extends Phaser.GameObjects.GameObject>(object: T) => {
    extras.push(object);
    return object;
  };
  const particles = (x: number, y: number, config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig) =>
    track(scene.add.particles(x, y, LIGHT.dot, { blendMode: Phaser.BlendModes.ADD, ...config })).setDepth(STORY_DEPTH.light);

  // Midi steps down beside the dialogue panel.
  scene.tweens.add({ targets: mascot, x: STORY_MIDI.x, y: STORY_MIDI.y, duration: motion(420), ease: "Sine.easeInOut" });

  // --- Light gathering in the middle of the board ------------------------------
  // Centre of the gem cluster, where the gems' light gathers.
  const gather = { x: board.x, y: board.y + board.displayHeight * 0.02 };
  const core = track(scene.add.image(gather.x, gather.y, LIGHT.glow))
    .setDepth(STORY_DEPTH.light).setBlendMode(Phaser.BlendModes.ADD).setScale(0).setAlpha(0);

  // --- Door into the village ---------------------------------------------------
  const maskShape = scene.make.graphics({ x: PORTAL.x, y: PORTAL.y });
  maskShape.fillStyle(0xffffff, 1).fillEllipse(0, 0, PORTAL.width, PORTAL.height);
  maskShape.setScale(0);
  const village = track(scene.add.image(PORTAL.x, PORTAL.y, INTRO_STORY_TEXTURES.village))
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
  const gemShines: Phaser.GameObjects.Image[] = [];
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
    scene.tweens.killTweensOf(gemShines);
    scene.tweens.add({ targets: gemShines, alpha: 0, duration: instant ? 0 : motion(300) });
    scene.tweens.killTweensOf(board);
    scene.tweens.add({
      targets: board, alpha: 0, scaleX: board.scaleX * 0.94, scaleY: board.scaleY * 0.94,
      duration: instant ? 0 : motion(520), ease: "Sine.easeIn",
    });
  };

  // --- Name labels --------------------------------------------------------------
  const chip = (text: string, anchor: Readonly<{ x: number; y: number }>, delay: number, accent: number) => {
    const label = scene.add
      .text(0, 0, text, { fontFamily: FONT_FAMILY, fontSize: "19px", fontStyle: "bold", color: "#2f3d68" })
      .setOrigin(0.5).setResolution(3);
    const width = label.width + 34;
    const height = 40;
    const plate = scene.add.graphics();
    plate.fillStyle(0x2b3f86, 0.2).fillRoundedRect(-width / 2 + 2, -height / 2 + 4, width, height, 16);
    plate.fillStyle(0xfffaf0, 1).fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    plate.lineStyle(3, accent, 1).strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
    plate.fillStyle(0xfffaf0, 1).fillTriangle(-9, height / 2 - 1.5, 9, height / 2 - 1.5, 0, height / 2 + 12);
    plate.lineStyle(3, accent, 1).lineBetween(-9, height / 2 - 1, 0, height / 2 + 12);
    plate.lineBetween(0, height / 2 + 12, 9, height / 2 - 1);
    // The pointer tip lands on the anchor (the roof top).
    const restY = anchor.y - height / 2 - 12;
    const group = track(scene.add.container(anchor.x, restY + 10, [plate, label]))
      .setDepth(STORY_DEPTH.chip).setAlpha(0).setScale(0.7);
    scene.tweens.add({ targets: group, alpha: 1, scale: 1, y: restY, delay, duration: motion(320), ease: "Back.easeOut" });
    if (!calm) {
      scene.time.delayedCall(delay, () => {
        const burst = particles(anchor.x, restY, {
          emitting: false, lifespan: 600, speed: { min: 40, max: 120 }, scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 }, tint: [0xffffff, 0xfff2a8],
        });
        burst.explode(12);
      });
      scene.tweens.add({ targets: group, y: restY - 5, delay: delay + 340, duration: 950, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
    return group;
  };

  // --- Dialogue panel ---------------------------------------------------------------
  const panelWidth = PANEL.right - PANEL.left;
  const panelX = PANEL.left + panelWidth / 2;
  const panelPlate = scene.add.graphics();
  panelPlate.fillStyle(0x2b3f86, 0.18).fillRoundedRect(-panelWidth / 2 + 3, -PANEL.height / 2 + 6, panelWidth, PANEL.height, 24);
  panelPlate.fillStyle(0xffffff, 0.97).fillRoundedRect(-panelWidth / 2, -PANEL.height / 2, panelWidth, PANEL.height, 24);
  panelPlate.lineStyle(3, 0xc9c2ec, 1).strokeRoundedRect(-panelWidth / 2, -PANEL.height / 2, panelWidth, PANEL.height, 24);
  // Little tail toward Midi on the left.
  panelPlate.fillStyle(0xffffff, 1).fillTriangle(-panelWidth / 2 + 1.5, 4, -panelWidth / 2 + 1.5, 28, -panelWidth / 2 - 16, 22);
  panelPlate.lineStyle(3, 0xc9c2ec, 1).lineBetween(-panelWidth / 2, 4, -panelWidth / 2 - 16, 22);
  panelPlate.lineBetween(-panelWidth / 2 - 16, 22, -panelWidth / 2, 28);
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
  const panel = track(scene.add.container(panelX, PANEL.y, [panelPlate, nameTag, nameText, lineText, nextArrow]))
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
    y: board.y + spot[1] * board.displayHeight,
  });
  const chips: Phaser.GameObjects.Container[] = [];
  const clearChips = () => {
    for (const item of chips.splice(0)) {
      scene.tweens.killTweensOf(item);
      scene.tweens.add({ targets: item, alpha: 0, scale: 0.85, duration: motion(200) });
    }
  };
  let gateMotes: Phaser.GameObjects.Particles.ParticleEmitter | undefined;
  const beats: Beat[] = [
    {
      // Each gem lights up in turn and sends its light to the middle of the board.
      talk: "surprised",
      after: "surprised",
      line: "어? 보석들이 하나씩 빛나기 시작했어.",
      lineDelayMs: 450,
      enter: () => {
        talker.setMood("surprised");
        GEM_SPOTS.forEach((spot, index) => {
          const gem = boardPoint(spot);
          const delay = motion(250 + index * 150);
          const shine = track(scene.add.image(gem.x, gem.y, LIGHT.glow))
            .setDepth(STORY_DEPTH.light).setBlendMode(Phaser.BlendModes.ADD).setScale(0).setAlpha(0);
          gemShines.push(shine);
          scene.tweens.add({ targets: shine, scale: 0.55, alpha: 0.9, delay, duration: motion(260), ease: "Sine.easeOut" });
          scene.tweens.add({ targets: shine, alpha: 0.35, scale: 0.4, delay: delay + motion(260), duration: motion(500) });
          if (calm) return;
          // A small orb of light floats from the gem into the centre.
          scene.time.delayedCall(delay + 300, () => {
            const orb = track(scene.add.image(gem.x, gem.y, LIGHT.dot))
              .setDepth(STORY_DEPTH.light).setBlendMode(Phaser.BlendModes.ADD).setScale(0.9);
            const trail = particles(0, 0, {
              follow: orb, lifespan: 420, speed: 8, scale: { start: 0.45, end: 0 }, alpha: { start: 0.8, end: 0 },
              frequency: 22, tint: [0xffffff, 0xbdeeff],
            });
            scene.tweens.add({
              targets: orb, x: gather.x, y: gather.y, scale: 0.5, duration: 700, ease: "Sine.easeIn",
              onComplete: () => {
                orb.setVisible(false);
                trail.stop();
                // Late orbs (after a quick tap) must not relight the core over the open door.
                if (portalOpen) return;
                scene.tweens.add({ targets: core, scale: `+=${0.09}`, alpha: Math.min(1, 0.25 + index * 0.09), duration: 160 });
              },
            });
          });
        });
        if (!calm) {
          scene.tweens.add({ targets: core, scale: { from: 0.4, to: 0.5 }, alpha: { from: 0.2, to: 0.3 }, delay: 400, duration: 300 });
        }
      },
    },
    {
      // The gathered light bursts, and the board opens into a door.
      // Arms up for the open door.
      talk: "happy",
      after: MIDI_POSE.cheer,
      line: "마법판의 힘으로 배움마을로 갈 수 있는 문이 열렸어!",
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
      // The three buildings, one by one.
      talk: "idle",
      after: "idle",
      line: "AI 제작소, 데이터 비행장, 윤리 심사소에서 AI 월드에서 배운 것을 직접 해 볼 수 있어.",
      lineDelayMs: 250,
      enter: () => {
        openPortal(true);
        const places = [
          ["AI 제작소", VILLAGE_SPOTS.workshop, 0xe0795a],
          ["데이터 비행장", VILLAGE_SPOTS.airport, 0x4b8fe0],
          ["윤리 심사소", VILLAGE_SPOTS.ethics, 0xd9a23a],
        ] as const;
        places.forEach(([name, spot, accent], index) => {
          chips.push(chip(name, villagePoint(spot), motion(150 + index * 520), accent));
        });
      },
    },
    {
      // The graduation-path gate starts to sparkle.
      talk: "happy",
      after: "idle",
      line: `세 장소에서 별 ${WORLD_EXIT_REQUIRED_STARS}개를 모으면 별빛 졸업길이 열려!`,
      lineDelayMs: 250,
      enter: () => {
        openPortal(true);
        clearChips();
        const opening = VILLAGE_SPOTS.gateOpening;
        const center = villagePoint(opening);
        if (!calm) {
          gateMotes = particles(center.x, center.y, {
            lifespan: { min: 900, max: 1_500 },
            speedY: { min: -70, max: -30 },
            speedX: { min: -12, max: 12 },
            scale: { start: 0.6, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xfff2a8, 0xffffff, 0xd9ccff],
            frequency: 40,
            emitZone: {
              type: "random",
              // Anywhere inside the gate's swirling opening.
              source: {
                getRandomPoint: (point: Phaser.Types.Math.Vector2Like) => {
                  point.x = (Math.random() - 0.5) * opening.width * VILLAGE_VIEW.width;
                  point.y = (Math.random() - 0.5) * opening.height * VILLAGE_VIEW.height;
                },
              },
            },
          });
        }
        chips.push(chip("별빛 졸업길", villagePoint(VILLAGE_SPOTS.gateTop), motion(500), 0xe9a735));
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
    lineText.setText("");
    beat.enter();
    scene.time.delayedCall(motion(beat.lineDelayMs), () => {
      if (finishing) return;
      talker.say(layoutLine(beat.line), render, () => {
        if (isMood(beat.after)) talker.setMood(beat.after);
        else talker.setPose(beat.after);
        lineReady = true;
        nextArrow.setVisible(true);
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
    gateMotes?.stop();
    skip.disableInteractive();
    scene.tweens.add({ targets: [panel, skip, ...chips], alpha: 0, duration: motion(220) });
    // Midi flies into the door with a trail of light, then the door swallows the screen.
    scene.tweens.killTweensOf(mascot);
    if (!calm) {
      particles(0, 0, {
        follow: mascot, followOffset: { x: 0, y: -60 }, lifespan: 500, speed: 10,
        scale: { start: 0.7, end: 0 }, alpha: { start: 0.9, end: 0 }, frequency: 18, tint: [0xffffff, 0xbdeeff],
      }).setDepth(STORY_DEPTH.chip);
    }
    scene.tweens.add({
      targets: mascot, x: PORTAL.x, y: PORTAL.y + 60, scale: 0.3, alpha: 0,
      duration: motion(760), ease: "Cubic.easeIn",
    });
    scene.tweens.add({ targets: maskShape, scale: 2.7, delay: motion(560), duration: motion(760), ease: "Cubic.easeIn" });
    scene.tweens.add({ targets: ring, scale: ringScale * 2.7, alpha: 0, delay: motion(560), duration: motion(760), ease: "Cubic.easeIn" });
    scene.tweens.add({ targets: village, scale: villageScale * 1.8, delay: motion(560), duration: motion(760), ease: "Cubic.easeIn" });
    scene.time.delayedCall(motion(940), () => scene.cameras.main.fadeOut(motion(320) || 1, 255, 245, 220));
    scene.time.delayedCall(motion(1_300), () => options.onFinish());
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
