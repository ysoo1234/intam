import Phaser from "phaser";

export function startWorkshopDialogue(
  scene: Phaser.Scene,
  dialogueText: Phaser.GameObjects.Text | undefined,
  previousTimer: Phaser.Time.TimerEvent | undefined,
  text: string,
  onComplete?: () => void,
  speed = 25,
) {
  previousTimer?.remove(false);
  dialogueText?.setText("");
  let index = 0;
  return scene.time.addEvent({
    delay: speed,
    repeat: Math.max(0, text.length - 1),
    callback: () => {
      index += 1;
      dialogueText?.setText(text.slice(0, index));
      if (index >= text.length) onComplete?.();
    },
  });
}
