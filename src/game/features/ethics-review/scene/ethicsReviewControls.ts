import Phaser from "phaser";
import type { EthicsVerdict } from "../model";

export function createEthicsReviewControls(
  scene: Phaser.Scene,
  onBack: () => void,
  onChoose: (verdict: EthicsVerdict) => void,
  onStart: () => void,
) {
  const chooseApprove = () => onChoose("approve");
  const chooseReject = () => onChoose("reject");

  scene.input.keyboard?.on("keydown-ESC", onBack);
  scene.input.keyboard?.on("keydown-LEFT", chooseApprove);
  scene.input.keyboard?.on("keydown-RIGHT", chooseReject);
  scene.input.keyboard?.on("keydown-SPACE", onStart);
  scene.input.keyboard?.on("keydown-ENTER", onStart);

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.input.keyboard?.off("keydown-ESC", onBack);
    scene.input.keyboard?.off("keydown-LEFT", chooseApprove);
    scene.input.keyboard?.off("keydown-RIGHT", chooseReject);
    scene.input.keyboard?.off("keydown-SPACE", onStart);
    scene.input.keyboard?.off("keydown-ENTER", onStart);
  });
}
