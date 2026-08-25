import Phaser from "phaser";
import { COLORS } from "../../../core/visual/theme";
import { AI_TOOLS } from "../../../content/questions";

export function generateAiToolTextures(scene: Phaser.Scene) {
  const badgeColors = [
    COLORS.coral,
    COLORS.blue,
    COLORS.yellow,
    0xb69be7,
    COLORS.coral,
    COLORS.blue,
    COLORS.mint,
    0xf0a4b7,
    COLORS.yellow,
    COLORS.mint,
  ];

  AI_TOOLS.forEach((tool, index) => {
    const textureKey = `ai-tool-${tool.id}`;
    if (scene.textures.exists(textureKey)) return;

    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(COLORS.ink, 0.2);
    g.fillCircle(67, 68, 52);
    g.fillStyle(badgeColors[index], 1);
    g.fillCircle(64, 63, 51);
    g.lineStyle(6, COLORS.ink, 1);
    g.strokeCircle(64, 63, 51);
    g.fillStyle(COLORS.cream, 1);
    g.fillCircle(64, 63, 38);

    switch (tool.id) {
      case "voice-recognition":
        g.fillStyle(COLORS.coral, 1);
        g.fillRoundedRect(54, 31, 20, 43, 10);
        g.lineStyle(5, COLORS.ink, 1);
        g.strokeRoundedRect(54, 31, 20, 43, 10);
        g.beginPath();
        g.arc(64, 62, 23, 0, Math.PI);
        g.strokePath();
        g.lineBetween(64, 85, 64, 96);
        g.lineBetween(51, 96, 77, 96);
        break;
      case "image-recognition":
        g.fillStyle(COLORS.blue, 1);
        g.fillRoundedRect(35, 43, 58, 42, 8);
        g.lineStyle(5, COLORS.ink, 1);
        g.strokeRoundedRect(35, 43, 58, 42, 8);
        g.fillStyle(COLORS.cream, 1);
        g.fillCircle(64, 64, 14);
        g.strokeCircle(64, 64, 14);
        g.fillStyle(COLORS.yellow, 1);
        g.fillCircle(84, 52, 5);
        break;
      case "translation":
        g.fillStyle(COLORS.blue, 1);
        g.fillRoundedRect(29, 37, 42, 32, 12);
        g.fillStyle(COLORS.coral, 1);
        g.fillRoundedRect(57, 61, 42, 32, 12);
        g.lineStyle(4, COLORS.ink, 1);
        g.strokeRoundedRect(29, 37, 42, 32, 12);
        g.strokeRoundedRect(57, 61, 42, 32, 12);
        g.lineBetween(45, 79, 82, 48);
        g.fillStyle(COLORS.ink, 1);
        g.fillTriangle(80, 43, 91, 46, 84, 55);
        break;
      case "recommendation": {
        const points: Phaser.Math.Vector2[] = [];
        for (let pointIndex = 0; pointIndex < 10; pointIndex += 1) {
          const angle = -Math.PI / 2 + (Math.PI * pointIndex) / 5;
          const radius = pointIndex % 2 === 0 ? 28 : 13;
          points.push(
            new Phaser.Math.Vector2(
              64 + Math.cos(angle) * radius,
              64 + Math.sin(angle) * radius,
            ),
          );
        }
        g.fillStyle(COLORS.yellow, 1);
        g.fillPoints(points, true);
        g.lineStyle(5, COLORS.ink, 1);
        g.strokePoints(points, true);
        g.fillStyle(COLORS.coral, 1);
        g.fillCircle(91, 38, 6);
        g.fillCircle(36, 88, 5);
        break;
      }
      case "self-driving":
        g.fillStyle(COLORS.coral, 1);
        g.fillRoundedRect(31, 55, 66, 30, 10);
        g.fillRoundedRect(45, 42, 38, 24, 10);
        g.lineStyle(5, COLORS.ink, 1);
        g.strokeRoundedRect(31, 55, 66, 30, 10);
        g.strokeRoundedRect(45, 42, 38, 24, 10);
        g.fillStyle(COLORS.ink, 1);
        g.fillCircle(45, 86, 9);
        g.fillCircle(84, 86, 9);
        g.fillStyle(COLORS.cream, 1);
        g.fillCircle(45, 86, 4);
        g.fillCircle(84, 86, 4);
        break;
      case "ai-speaker":
        g.fillStyle(COLORS.blue, 1);
        g.fillRoundedRect(44, 34, 40, 58, 19);
        g.lineStyle(5, COLORS.ink, 1);
        g.strokeRoundedRect(44, 34, 40, 58, 19);
        g.fillStyle(COLORS.cream, 1);
        g.fillCircle(64, 70, 10);
        g.strokeCircle(64, 70, 10);
        g.lineStyle(4, COLORS.coral, 1);
        g.beginPath();
        g.arc(64, 70, 20, -0.7, 0.7);
        g.strokePath();
        break;
      case "chatbot":
        g.fillStyle(COLORS.mint, 1);
        g.fillRoundedRect(29, 38, 70, 48, 18);
        g.lineStyle(5, COLORS.ink, 1);
        g.strokeRoundedRect(29, 38, 70, 48, 18);
        g.fillStyle(COLORS.mint, 1);
        g.fillTriangle(43, 83, 52, 83, 43, 95);
        g.fillStyle(COLORS.ink, 1);
        g.fillCircle(48, 62, 5);
        g.fillCircle(64, 62, 5);
        g.fillCircle(80, 62, 5);
        break;
      case "medical-analysis":
        g.fillStyle(0xf4a0b2, 1);
        g.fillRoundedRect(52, 34, 24, 59, 6);
        g.fillRoundedRect(34, 52, 60, 24, 6);
        g.lineStyle(5, COLORS.ink, 1);
        g.strokeRoundedRect(52, 34, 24, 59, 6);
        g.strokeRoundedRect(34, 52, 60, 24, 6);
        g.fillStyle(COLORS.cream, 1);
        g.fillCircle(86, 84, 10);
        g.strokeCircle(86, 84, 10);
        break;
      case "robot-vacuum":
        g.fillStyle(COLORS.yellow, 1);
        g.fillEllipse(64, 67, 68, 48);
        g.lineStyle(5, COLORS.ink, 1);
        g.strokeEllipse(64, 67, 68, 48);
        g.fillStyle(COLORS.ink, 1);
        g.fillRoundedRect(54, 46, 20, 8, 4);
        g.fillCircle(48, 68, 5);
        g.fillCircle(80, 68, 5);
        g.lineBetween(43, 91, 34, 98);
        g.lineBetween(85, 91, 94, 98);
        break;
      case "smart-farm":
        g.lineStyle(6, COLORS.ink, 1);
        g.lineBetween(64, 92, 64, 52);
        g.fillStyle(COLORS.mint, 1);
        g.fillEllipse(48, 54, 31, 20);
        g.fillEllipse(80, 45, 31, 20);
        g.lineStyle(4, COLORS.ink, 1);
        g.strokeEllipse(48, 54, 31, 20);
        g.strokeEllipse(80, 45, 31, 20);
        g.fillStyle(COLORS.blue, 1);
        g.fillCircle(41, 86, 7);
        g.fillCircle(88, 78, 6);
        break;
    }

    g.generateTexture(textureKey, 128, 128);
    g.destroy();
  });
}

