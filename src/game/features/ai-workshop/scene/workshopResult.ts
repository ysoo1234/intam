import Phaser from "phaser";
import {
  COLORS,
  getTextStyle,
  TEXT_COLORS,
  UI_RADII,
} from "../../../core/visual/theme";
import {
  addUiButton,
  addUiSurface,
  type UiButtonVariant,
} from "../../../core/visual/uiPrimitives";

export type WorkshopResult = {
  timeCompleted: boolean;
  completedCustomers: number;
  coins: number;
  stars: 1 | 2 | 3;
  onRetry: () => void;
  onWorld: () => void;
};

export function createWorkshopResultOverlay(
  scene: Phaser.Scene,
  result: WorkshopResult,
) {
  const overlay = scene.add.container(640, 360).setDepth(110);
  const shade = scene.add.rectangle(0, 0, 1280, 720, COLORS.ink, 0.8);
  const panel = addUiSurface(
    scene,
    { x: -385, y: -250, width: 770, height: 500 },
    "paper",
    {
      radius: UI_RADII.dialog,
      fillAlpha: 1,
      borderWidth: 4,
      shadow: "medium",
    },
  );
  const icon = scene.add
    .text(0, -190, result.timeCompleted ? "🏆" : "🛠️", {
      fontSize: "68px",
    })
    .setOrigin(0.5);
  const title = scene.add
    .text(
      0,
      -118,
      result.timeCompleted ? "2분 영업 완료!" : "제작소 문을 잠시 닫아요",
      getTextStyle("display", {
        fontSize: "38px",
      }),
    )
    .setOrigin(0.5);
  const stars = scene.add
    .text(0, -63, `${"★".repeat(result.stars)}${"☆".repeat(3 - result.stars)}`, getTextStyle("title", {
      color: "#E9A735",
      fontSize: "34px",
    }))
    .setOrigin(0.5);
  const description = scene.add
    .text(
      0,
      18,
      result.timeCompleted
        ? `손님 ${result.completedCustomers}명의 부탁을 해결하고\n${result.coins}코인을 벌었어요!`
        : `잘못된 상품을 세 번 전달했어요.\n손님 ${result.completedCustomers}명 · ${result.coins}코인`,
      getTextStyle("title", {
        color: TEXT_COLORS.accent,
        fontSize: "25px",
        align: "center",
        lineSpacing: 12,
      }),
    )
    .setOrigin(0.5);
  const retry = createResultButton(
    scene,
    0,
    112,
    "다시 영업",
    "caution",
    result.onRetry,
  );
  const world = createResultButton(
    scene,
    0,
    192,
    "마을로 돌아가기",
    "positive",
    result.onWorld,
  );
  overlay.add([shade, panel, icon, title, stars, description, retry, world]);
  overlay.setScale(0.88).setAlpha(0);
  scene.tweens.add({
    targets: overlay,
    scale: 1,
    alpha: 1,
    duration: 420,
    ease: "Back.easeOut",
  });
  return overlay;
}

function createResultButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  variant: UiButtonVariant,
  onClick: () => void,
) {
  const { container } = addUiButton(scene, {
    x,
    y,
    width: 310,
    height: 60,
    label,
    onPress: onClick,
    variant,
    fontSize: "23px",
  });
  container.setSize(330, 72);
  return container;
}
