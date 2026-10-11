import Phaser from "phaser";

type Point = Readonly<{ x: number; y: number }>;

export type EthicsBubbleShape = Readonly<{
  width: number;
  height: number;
  radius: number;
  /** Which edge the tail grows from, where along that edge its base sits, and its tip. */
  tail: Readonly<{ side: "left" | "bottom"; from: number; to: number; tip: Point }>;
}>;

/**
 * Traces a rounded speech bubble with its tail as one outline (centred on 0,0),
 * so the border runs unbroken from the bubble into the tail and back.
 */
function traceBubble(g: Phaser.GameObjects.Graphics, shape: EthicsBubbleShape) {
  const { width: w, height: h, tail } = shape;
  const r = Math.min(shape.radius, h / 2, w / 2);
  const x = -w / 2;
  const y = -h / 2;
  // The tail's base stays on the straight part of its edge, clear of the corners.
  const edgeMin = tail.side === "left" ? y + r + 1 : x + r + 1;
  const edgeMax = tail.side === "left" ? y + h - r - 1 : x + w - r - 1;
  const a = Phaser.Math.Clamp(Math.min(tail.from, tail.to), edgeMin, edgeMax);
  const b = Phaser.Math.Clamp(Math.max(tail.from, tail.to), edgeMin, edgeMax);
  const deg = Phaser.Math.DegToRad;
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.arc(x + w - r, y + r, r, deg(-90), deg(0));
  g.lineTo(x + w, y + h - r);
  g.arc(x + w - r, y + h - r, r, deg(0), deg(90));
  if (tail.side === "bottom") {
    g.lineTo(b, y + h);
    g.lineTo(tail.tip.x, tail.tip.y);
    g.lineTo(a, y + h);
  }
  g.lineTo(x + r, y + h);
  g.arc(x + r, y + h - r, r, deg(90), deg(180));
  if (tail.side === "left") {
    g.lineTo(x, b);
    g.lineTo(tail.tip.x, tail.tip.y);
    g.lineTo(x, a);
  }
  g.lineTo(x, y + r);
  g.arc(x + r, y + r, r, deg(180), deg(270));
  g.closePath();
}

/** Draws the soft shadow, the fill and the border of a bubble in one go. */
export function drawEthicsBubble(
  g: Phaser.GameObjects.Graphics,
  shape: EthicsBubbleShape,
  colors: Readonly<{ fill: number; line: number }>,
) {
  g.clear();
  g.fillStyle(0x315567, 0.14).fillRoundedRect(-shape.width / 2 + 3, -shape.height / 2 + 5, shape.width, shape.height, shape.radius);
  g.fillStyle(colors.fill, 1);
  traceBubble(g, shape);
  g.fillPath();
  g.lineStyle(2.5, colors.line, 1);
  traceBubble(g, shape);
  g.strokePath();
}
