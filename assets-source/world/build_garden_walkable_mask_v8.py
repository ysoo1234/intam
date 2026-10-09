"""Builds the walkable mask (white = walkable, 1280 x 720) for the v8 garden
ground by colour: trees, bushes, flower beds, the far hills and the sky are
blocked; grass, the cream stone paths and their edge lines are walkable.
Specks smaller than MIN_OBSTACLE_PX are grass shading and stay walkable.
v9: Midi may cross the small bushes and flower beds inside the garden
(PASSABLE_BUSH_AREAS); its trees and rocks (KEEP_BLOCKED) and the forest
around the edge stay blocked.

    python3 assets-source/world/build_garden_walkable_mask_v8.py
    node scripts/generate-village-collision-mask.mjs --preview

Add polygons to EXTRA_BLOCKED / EXTRA_WALKABLE to touch it up by hand.
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "assets-source/world/village_garden_raw_v2.png"
OUT = ROOT / "assets-source/world/village-walkable-mask-v9.png"
MIN_OBSTACLE_PX = 120  # blocked blobs smaller than this are grass texture

EXTRA_BLOCKED: list = []
EXTRA_WALKABLE = [
    # the small bushes at the top lawn's lower corners sit right behind the
    # fountain; keep the ring around the fountain open so Midi can circle it
    [(500, 222), (780, 222), (780, 285), (500, 285)],
    # same for the bushes at the bottom lawn's upper corners
    [(490, 480), (815, 480), (815, 545), (490, 545)],
]
# the garden inside the edge forest: its small bushes and flower beds are
# walkable
PASSABLE_BUSH_AREAS = [
    [(70, 108), (1210, 108), (1210, 682), (70, 682)],
]
# trees and rocks inside PASSABLE_BUSH_AREAS, as (centre x, centre y,
# radius x, radius y) ellipses around their trunks / bases
KEEP_BLOCKED = [
    (455, 128, 18, 30),   # top lawn: tall conifer
    (428, 142, 12, 20),   # top lawn: small conifer
    (480, 152, 18, 12),   # top lawn: rock
    (832, 125, 20, 32),   # top lawn: conifer
    (790, 135, 18, 12),   # top lawn: rock
    (1095, 447, 16, 26),  # right lawn: conifer
    (1123, 452, 14, 22),  # right lawn: conifer
    (1182, 497, 18, 12),  # right lawn: rock
    (62, 495, 22, 14),    # left lawn: rock
]


def main():
    rgb = np.array(Image.open(SOURCE).convert("RGB").resize((1280, 720), Image.LANCZOS))
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(int)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    # Obstacles by colour; everything else (grass, paths, their edge lines)
    # is walkable.
    foliage = (h >= 34) & (h <= 80) & (v < 170) & (s >= 60)
    far = (h >= 50) & (v >= 150)            # hills (blue-green) and sky
    flowers = ((h <= 14) | (h >= 165)) & (s >= 70) & (v >= 150)
    blocked = foliage | far | flowers
    blocked = ndi.binary_closing(blocked, structure=np.ones((3, 3)), iterations=1)
    blocked = ndi.binary_fill_holes(blocked)
    # drop specks that are only grass shading
    labels, count = ndi.label(blocked)
    sizes = ndi.sum(blocked, labels, range(1, count + 1))
    blocked = np.isin(labels, np.nonzero(sizes >= MIN_OBSTACLE_PX)[0] + 1)
    # (no extra margin here: the game samples a footprint around Midi's feet)
    walk = ~blocked
    labels, count = ndi.label(walk)
    sizes = ndi.sum(walk, labels, range(1, count + 1))
    walk = labels == (np.argmax(sizes) + 1)

    mask = Image.fromarray((walk * 255).astype(np.uint8)).convert("RGB")
    draw = ImageDraw.Draw(mask)
    for polygon in EXTRA_BLOCKED:
        draw.polygon(polygon, fill=(0, 0, 0))
    for polygon in EXTRA_WALKABLE + PASSABLE_BUSH_AREAS:
        draw.polygon(polygon, fill=(255, 255, 255))
    for cx, cy, rx, ry in KEEP_BLOCKED:
        draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(0, 0, 0))
    mask.save(OUT)


if __name__ == "__main__":
    main()
