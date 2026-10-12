import Phaser from "phaser";
import { ENDING_CERTIFICATE, ENDING_PHOTO_CAPTIONS } from "../../../content/endingStory";
import { DISPLAY_FONT_FAMILY } from "../../../core/visual/fonts";
import { FONT_FAMILY } from "../../../core/visual/theme";
import { addEndingArtButton, type EndingButtonVariant } from "./endingButtons";
import { createEndingCamera } from "./endingCamera";
import {
  CERTIFICATE_PHOTO,
  CERTIFICATE_SEAL,
  CERTIFICATE_SIZE,
  createCertificateCanvas,
  drawEndingCertificate,
  drawEndingSeal,
  type CertificateArt,
} from "./endingCertificate";
import {
  ENDING_CERTIFICATE_BUTTONS_Y,
  ENDING_CERTIFICATE_CAPTION_Y,
  ENDING_CERTIFICATE_VIEW,
  ENDING_DEPTH,
} from "./endingLayout";
import { burstLight } from "./endingLights";
import { makeCertificateBlob, saveCertificate } from "./endingSave";

const CERTIFICATE_TEXTURE = "ending-certificate";
const SEAL_TEXTURE = "ending-seal";
const VIEW_SCALE = ENDING_CERTIFICATE_VIEW.width / CERTIFICATE_SIZE.width;
const VIEW_LEFT = ENDING_CERTIFICATE_VIEW.x - ENDING_CERTIFICATE_VIEW.width / 2;
const VIEW_TOP = ENDING_CERTIFICATE_VIEW.y - (CERTIFICATE_SIZE.height * VIEW_SCALE) / 2;
const toScreen = (x: number, y: number) => ({ x: VIEW_LEFT + x * VIEW_SCALE, y: VIEW_TOP + y * VIEW_SCALE });

type ButtonSpec = Readonly<{
  label: string;
  variant?: EndingButtonVariant;
  width?: number;
  /** Set apart at the right (다음 ▶ / 닫기); the others stay centred as before. */
  right?: boolean;
  onPress: () => void;
}>;
/** Where a right-hand button sits: by the certificate's right edge. */
const RIGHT_BUTTON_X = 1_120;

/** The finished certificate, kept for "증명서 다시 보기" on the last screen. */
export type FinishedCertificate = Readonly<{ canvas: HTMLCanvasElement; blob?: Blob }>;

/**
 * Act 4: the certificate rises over the village. With the camera on, the
 * student and Midi pose in the photo slot, 3-2-1 and click; without it Midi's
 * picture fills the slot. Midi's seal lands, then 다시 찍기 / 저장하기 / 다음.
 * In "review" mode it only shows the finished certificate with 저장 and 닫기.
 */
export function showEndingCertificate(
  scene: Phaser.Scene,
  options: Readonly<{
    calm: boolean;
    stars: number;
    starsMax: number;
    art: CertificateArt;
    /** Start on this finished certificate (viewing it again); retaking is allowed. */
    review?: FinishedCertificate;
    /** The label of the button that closes the view (default "다음 ▶"). */
    closeLabel?: string;
    onDone: (finished: FinishedCertificate) => void;
  }>,
) {
  const motion = (ms: number) => (options.calm ? 0 : ms);
  const golden = options.stars >= options.starsMax;
  const objects: Phaser.GameObjects.GameObject[] = [];
  const track = <T extends Phaser.GameObjects.GameObject>(object: T) => {
    objects.push(object);
    return object;
  };
  const blocker = track(scene.add.rectangle(640, 360, 1280, 720, 0x14203f, 0)
    .setDepth(ENDING_DEPTH.certificateDim)
    .setInteractive());
  blocker.on("pointerdown", (
    _pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData,
  ) => event.stopPropagation());
  scene.tweens.add({ targets: blocker, fillAlpha: 0.62, duration: motion(320) });

  const canvas = options.review?.canvas ?? createCertificateCanvas();
  let photo: CanvasImageSource | "midi" | null = null;
  let stamped = false;
  let blob = options.review?.blob;
  /** Why Midi's picture is in the slot (no camera), kept on the finished caption. */
  let note = "";
  const redraw = () => {
    drawEndingCertificate(canvas, { photo, stars: options.stars, starsMax: options.starsMax, golden, stamped, art: options.art });
    const texture = scene.textures.get(CERTIFICATE_TEXTURE) as Phaser.Textures.CanvasTexture;
    texture.refresh();
  };
  if (scene.textures.exists(CERTIFICATE_TEXTURE)) scene.textures.remove(CERTIFICATE_TEXTURE);
  scene.textures.addCanvas(CERTIFICATE_TEXTURE, canvas);
  if (!options.review) redraw();
  const certificate = track(scene.add
    .image(ENDING_CERTIFICATE_VIEW.x, ENDING_CERTIFICATE_VIEW.y, CERTIFICATE_TEXTURE)
    .setScale(VIEW_SCALE)
    .setDepth(ENDING_DEPTH.certificate));
  certificate.setAlpha(0).setY(ENDING_CERTIFICATE_VIEW.y + 60).setAngle(-3);
  scene.tweens.add({
    targets: certificate, alpha: 1, y: ENDING_CERTIFICATE_VIEW.y, angle: 0,
    duration: motion(520), ease: "Back.easeOut",
  });

  const caption = track(scene.add
    .text(640, ENDING_CERTIFICATE_CAPTION_Y, "", {
      fontFamily: FONT_FAMILY, fontSize: "18px", fontStyle: "bold", color: "#fffaf0", align: "center",
    })
    .setOrigin(0.5)
    .setResolution(3)
    .setDepth(ENDING_DEPTH.certificateUi));
  const say = (text: string) => caption.setText(text);

  let buttons: Phaser.GameObjects.Container[] = [];
  const setButtons = (specs: readonly ButtonSpec[]) => {
    buttons.forEach((button) => button.destroy(true));
    const gap = 18;
    const centred = specs.filter((spec) => !spec.right);
    const widths = centred.map((spec) => spec.width ?? 200);
    const total = widths.reduce((sum, width) => sum + width, 0) + gap * (centred.length - 1);
    let x = 640 - total / 2;
    const placeX = (spec: ButtonSpec, width: number) => {
      if (spec.right) return RIGHT_BUTTON_X;
      const middle = x + width / 2;
      x += width + gap;
      return middle;
    };
    buttons = specs.map((spec, index) => {
      const width = spec.width ?? 200;
      const button = addEndingArtButton(scene, {
        x: placeX(spec, width),
        y: ENDING_CERTIFICATE_BUTTONS_Y,
        width,
        height: 56,
        label: spec.label,
        variant: spec.variant ?? "paper",
        fontSize: "21px",
        depth: ENDING_DEPTH.certificateUi,
        onPress: spec.onPress,
      });
      button.setAlpha(0);
      scene.tweens.add({ targets: button, alpha: 1, delay: motion(index * 60), duration: motion(200) });
      return button;
    });
  };

  const slot = () => {
    const topLeft = toScreen(CERTIFICATE_PHOTO.x, CERTIFICATE_PHOTO.y);
    return {
      x: topLeft.x, y: topLeft.y,
      width: CERTIFICATE_PHOTO.width * VIEW_SCALE, height: CERTIFICATE_PHOTO.height * VIEW_SCALE,
    };
  };
  const camera = createEndingCamera(scene, {
    slot,
    onInterrupted: () => showStart(),
  });

  let closing = false;
  const close = () => {
    if (closing) return;
    closing = true;
    camera.stop();
    setButtons([]);
    scene.tweens.add({
      targets: objects.filter((object) => object.active), alpha: 0, duration: motion(260),
      onComplete: () => {
        objects.forEach((object) => object.destroy());
        options.onDone({ canvas, blob });
      },
    });
  };

  const save = async () => {
    if (!blob) blob = await makeCertificateBlob(canvas);
    if (!blob) return;
    const result = await saveCertificate(blob, ENDING_CERTIFICATE.fileName);
    if (result === "shared" || result === "downloaded") say(ENDING_PHOTO_CAPTIONS.saved);
  };

  const showFinished = () => {
    say(note ? `${note} 저장하면 이 기기에 사진으로 남아요.` : ENDING_PHOTO_CAPTIONS.done);
    setButtons([
      { label: photo === "midi" ? "카메라로 찍기" : "다시 찍기", onPress: () => void startCamera() },
      { label: "저장하기", variant: "primary", onPress: () => void save() },
      { label: options.closeLabel ?? "다음 ▶", variant: "primary", width: 170, right: true, onPress: close },
    ]);
  };

  /** Midi's seal lands with a thump, then the certificate is ready to save. */
  const stamp = () => {
    setButtons([]);
    const spot = toScreen(CERTIFICATE_SEAL.x, CERTIFICATE_SEAL.y);
    const side = Math.ceil(CERTIFICATE_SEAL.radius * 2.3);
    if (!scene.textures.exists(SEAL_TEXTURE)) {
      const sealTexture = scene.textures.createCanvas(SEAL_TEXTURE, side, side);
      if (sealTexture) {
        drawEndingSeal(sealTexture.getContext(), side / 2, side / 2, CERTIFICATE_SEAL.radius);
        sealTexture.refresh();
      }
    }
    const seal = track(scene.add
      .image(spot.x, spot.y, SEAL_TEXTURE)
      .setScale(VIEW_SCALE * 2.4)
      .setAlpha(0)
      .setDepth(ENDING_DEPTH.certificateUi));
    scene.tweens.add({
      targets: seal, scale: VIEW_SCALE, alpha: 1, duration: motion(260), ease: "Cubic.easeIn",
      onComplete: () => {
        if (!options.calm) scene.cameras.main.shake(120, 0.004);
        burstLight(scene, spot.x, spot.y, { depth: ENDING_DEPTH.certificateUi, count: 16, speed: 220, calm: options.calm });
        stamped = true;
        redraw();
        seal.destroy();
        blob = undefined;
        void makeCertificateBlob(canvas).then((made) => {
          blob = made;
        });
        showFinished();
      },
    });
  };

  const fillWithMidi = (reasonText?: string) => {
    camera.stop();
    photo = "midi";
    note = reasonText ?? "";
    redraw();
    if (reasonText) say(reasonText);
    stamp();
  };

  const countdown = () => {
    setButtons([]);
    say("");
    const center = slot();
    const number = track(scene.add
      .text(center.x + center.width / 2, center.y + center.height / 2, "", {
        fontFamily: DISPLAY_FONT_FAMILY, fontSize: "120px", color: "#ffffff",
        stroke: "#2b3f86", strokeThickness: 12,
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(ENDING_DEPTH.certificateUi));
    // The live <video> sits above the canvas, so the numbers show beside the slot.
    number.setX(center.x + center.width + 90);
    const step = (left: number) => {
      if (closing) return;
      if (left === 0) {
        number.destroy();
        const frame = camera.capture();
        camera.stop();
        const flash = track(scene.add.rectangle(640, 360, 1280, 720, 0xffffff, 0.9).setDepth(ENDING_DEPTH.flash));
        scene.tweens.add({ targets: flash, fillAlpha: 0, duration: motion(380), onComplete: () => flash.destroy() });
        if (!frame) {
          fillWithMidi(ENDING_PHOTO_CAPTIONS.noCamera);
          return;
        }
        photo = frame;
        redraw();
        stamp();
        return;
      }
      number.setText(String(left)).setScale(1.4).setAlpha(1);
      scene.tweens.add({ targets: number, scale: 1, alpha: 0.85, duration: motion(300), ease: "Back.easeOut" });
      scene.time.delayedCall(800, () => step(left - 1));
    };
    step(3);
  };

  const showPreview = () => {
    say(ENDING_PHOTO_CAPTIONS.preview);
    setButtons([
      { label: "찰칵!", variant: "primary", width: 220, onPress: countdown },
      { label: "사진 없이 만들기", width: 220, onPress: () => fillWithMidi() },
    ]);
  };

  const startCamera = async () => {
    note = "";
    stamped = false;
    photo = null;
    blob = undefined;
    redraw();
    setButtons([]);
    say(ENDING_PHOTO_CAPTIONS.asking);
    const result = await camera.start();
    if (closing) return;
    if (!result.ok) {
      fillWithMidi(ENDING_PHOTO_CAPTIONS.noCamera);
      return;
    }
    showPreview();
  };

  function showStart() {
    if (closing) return;
    camera.stop();
    stamped = false;
    photo = null;
    redraw();
    say(ENDING_PHOTO_CAPTIONS.intro);
    setButtons([
      { label: "카메라 켜기", variant: "primary", width: 220, onPress: () => void startCamera() },
      { label: "사진 없이 만들기", width: 220, onPress: () => fillWithMidi() },
    ]);
  }

  if (options.review) {
    // Viewing the finished certificate again: save it, or retake the photo.
    stamped = true;
    showFinished();
  } else {
    scene.time.delayedCall(motion(420), showStart);
  }
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => buttons.forEach((button) => button.destroy(true)));
}
