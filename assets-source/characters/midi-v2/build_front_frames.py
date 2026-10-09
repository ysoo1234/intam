"""Builds Midi's front-facing face frames from the generated sheets.

Every frame keeps the exact body of the default pose (expression sheet, slot 1);
only the dark face screen is replaced, so swapping frames at runtime never
makes the body jitter.

Usage (from the repository root):
    python3 assets-source/characters/midi-v2/build_front_frames.py

Inputs (generated artwork, kept as-is):
    assets-source/characters/midi_v2_faces.png  six expressions, front view
    assets-source/characters/midi_v2_talk.png   two talking mouths, front view
Outputs (editable sources for npm run assets:optimize):
    assets-source/characters/midi-v2/front-<frame>.png
"""

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[3]
CHAR = ROOT / "assets-source" / "characters"
OUT = CHAR / "midi-v2"
PAD = 6


def split_frames(path: Path, min_width: int = 60):
    image = np.array(Image.open(path).convert("RGBA"))
    solid = image[..., 3] > 40
    columns = solid.any(0)
    runs, start = [], None
    for x, filled in enumerate(columns):
        if filled and start is None:
            start = x
        if not filled and start is not None:
            if x - start >= min_width:
                runs.append((start, x))
            start = None
    if start is not None and len(columns) - start >= min_width:
        runs.append((start, len(columns)))
    frames = []
    for x0, x1 in runs:
        rows = np.where(solid[:, x0:x1].any(1))[0]
        frames.append(image[rows.min() : rows.max() + 1, x0:x1])
    return frames


def visor_mask(frame: np.ndarray) -> np.ndarray:
    lum = frame[..., :3].astype(int).mean(-1)
    dark = (lum < 70) & (frame[..., 3] > 200)
    labels, count = ndimage.label(dark)
    sizes = ndimage.sum(dark, labels, range(1, count + 1))
    mask = ndimage.binary_fill_holes(labels == (int(np.argmax(sizes)) + 1))
    # Stay just inside the screen rim so the base outline is kept.
    return ndimage.binary_erosion(mask, iterations=2)


def fit_to(frame: np.ndarray, size) -> np.ndarray:
    return np.array(Image.fromarray(frame).resize(size, Image.LANCZOS))


def best_shift(base: np.ndarray, other: np.ndarray, mask: np.ndarray, radius=5):
    """Shift that best lines up the other frame's screen with the base screen."""
    ys, xs = np.where(mask)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    target = visor_mask(other)
    best, best_score = (0, 0), -1.0
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            moved = np.roll(np.roll(target, dy, 0), dx, 1)
            score = (moved[y0:y1, x0:x1] & mask[y0:y1, x0:x1]).sum()
            if score > best_score:
                best, best_score = (dy, dx), score
    return best


def swap_face(base: np.ndarray, other: np.ndarray, mask: np.ndarray) -> np.ndarray:
    other = fit_to(other, (base.shape[1], base.shape[0]))
    dy, dx = best_shift(base, other, mask)
    other = np.roll(np.roll(other, dy, 0), dx, 1)
    soft = ndimage.gaussian_filter(mask.astype(float), 0.8)[..., None]
    out = base.astype(float) * (1 - soft) + other.astype(float) * soft
    out[..., 3] = base[..., 3]
    return out.round().clip(0, 255).astype(np.uint8)


def save(frame: np.ndarray, name: str):
    padded = np.zeros((frame.shape[0] + PAD * 2, frame.shape[1] + PAD * 2, 4), np.uint8)
    padded[PAD:-PAD, PAD:-PAD] = frame
    Image.fromarray(padded).save(OUT / f"front-{name}.png")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    faces = split_frames(CHAR / "midi_v2_faces.png")
    talk = split_frames(CHAR / "midi_v2_talk.png")
    assert len(faces) == 6, len(faces)
    assert len(talk) == 2, len(talk)
    base = faces[0]
    mask = visor_mask(base)
    save(base, "idle")
    named = {
        "talk-o": faces[1], "blink": faces[2], "happy": faces[3],
        "worried": faces[4], "surprised": faces[5],
        "talk-small": talk[0], "talk-big": talk[1],
    }
    for name, frame in named.items():
        save(swap_face(base, frame, mask), name)
    print("wrote", sorted(p.name for p in OUT.glob("front-*.png")))


if __name__ == "__main__":
    main()
