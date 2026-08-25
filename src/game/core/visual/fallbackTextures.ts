import Phaser from "phaser";
import { COLORS } from "./theme";

export function generatePlayerTexture(scene: Phaser.Scene) {
  if (scene.textures.exists("player-fallback")) return;

  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(COLORS.ink, 1);
  g.fillEllipse(48, 111, 63, 18);
  g.fillStyle(COLORS.coralDark, 1);
  g.fillRoundedRect(22, 62, 52, 44, 20);
  g.fillStyle(COLORS.coral, 1);
  g.fillRoundedRect(25, 58, 46, 41, 18);
  g.fillStyle(0xf2aa72, 1);
  g.fillCircle(48, 43, 28);
  g.fillStyle(COLORS.ink, 1);
  g.fillEllipse(49, 31, 53, 32);
  g.fillCircle(30, 40, 8);
  g.fillCircle(67, 40, 8);
  g.fillStyle(0xf2aa72, 1);
  g.fillCircle(34, 42, 5);
  g.fillCircle(63, 42, 5);
  g.fillStyle(COLORS.cream, 1);
  g.fillCircle(40, 47, 4);
  g.fillCircle(57, 47, 4);
  g.fillStyle(COLORS.ink, 1);
  g.fillCircle(41, 48, 2);
  g.fillCircle(58, 48, 2);
  g.lineStyle(3, COLORS.ink, 1);
  g.beginPath();
  g.arc(49, 54, 7, 0.15, Math.PI - 0.15);
  g.strokePath();
  g.fillStyle(COLORS.yellow, 1);
  g.fillTriangle(48, 65, 37, 78, 59, 78);
  g.fillStyle(COLORS.ink, 1);
  g.fillRoundedRect(24, 99, 19, 9, 4);
  g.fillRoundedRect(54, 99, 19, 9, 4);
  g.generateTexture("player-fallback", 96, 124);
  g.destroy();
}

export function generateCustomerTexture(scene: Phaser.Scene) {
  if (scene.textures.exists("customer-fallback")) return;

  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(COLORS.ink, 0.18);
  g.fillEllipse(78, 142, 105, 22);
  g.fillStyle(0x9e6145, 1);
  g.fillCircle(44, 47, 23);
  g.fillCircle(112, 47, 23);
  g.fillEllipse(78, 85, 120, 112);
  g.fillStyle(0xd9935f, 1);
  g.fillEllipse(78, 80, 104, 99);
  g.fillStyle(COLORS.cream, 1);
  g.fillCircle(56, 72, 17);
  g.fillCircle(99, 72, 17);
  g.fillStyle(COLORS.ink, 1);
  g.fillCircle(60, 75, 6);
  g.fillCircle(95, 75, 6);
  g.fillEllipse(78, 98, 38, 29);
  g.fillStyle(0xf6c99e, 1);
  g.fillEllipse(78, 97, 31, 22);
  g.fillStyle(COLORS.ink, 1);
  g.fillCircle(78, 91, 5);
  g.lineStyle(4, COLORS.ink, 1);
  g.beginPath();
  g.arc(78, 99, 9, 0.1, Math.PI - 0.1);
  g.strokePath();
  g.generateTexture("customer-fallback", 156, 154);
  g.destroy();
}
