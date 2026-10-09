"""Builds Midi's front-facing face frames from the generated sheets.

Every frame keeps the exact body of the default pose (expression sheet, slot 1);
only the dark face screen is replaced, so swapping frames at runtime never
makes the body jitter.

It also mixes eyes and mouths (eyes of one mood, a talking mouth from another
frame) so Midi can talk while looking happy, surprised or worried, and exports
the side, back and action poses at the same scale as the front frames.

Usage (from the repository root):
    python3 assets-source/characters/midi-v2/build_front_frames.py

Inputs (generated artwork, kept as-is):
    assets-source/characters/midi_v2_faces.png  six expressions, front view
    assets-source/characters/midi_v2_talk.png   two talking mouths, front view
    assets-source/characters/midi_v2_sheet.png  front / left / right / back
    assets-source/characters/midi_v2_actions.png move left / move right / fly / wave / cheer
    assets-source/characters/midi_v2_glide.png  gliding toward / away from the viewer
    assets-source/characters/midi_v2_fly.png    flying right: 4 flap frames, happy, ouch
    assets-source/characters/midi_v2_fly_fever.png  flying with sparkling eyes (fever)
Outputs (editable sources for npm run assets:optimize):
    assets-source/characters/midi-v2/front-<frame>.png
    assets-source/characters/midi-v2/pose-<pose>.png
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


# Where the mouth sits on the 324 x 403 front frame; the eyes lie above and to the sides.
MOUTH_CENTRE = (167, 186)


def mouth_mask(frame: np.ndarray) -> np.ndarray:
    """The glowing mouth shape: the bright screen mark nearest the mouth centre."""
    rgb = frame[..., :3].astype(int)
    glow = (rgb[..., 2] > 170) & (rgb[..., 1] > 140) & (rgb[..., 0] < 170) & (frame[..., 3] > 200)
    glow[:140] = False
    labels, count = ndimage.label(glow)
    if count == 0:
        return np.zeros(glow.shape, bool)
    centres = ndimage.center_of_mass(glow, labels, range(1, count + 1))
    cx, cy = MOUTH_CENTRE
    distances = [((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 for y, x in centres]
    return labels == (int(np.argmin(distances)) + 1)


def mix_mouth(eyes: np.ndarray, mouth: np.ndarray) -> np.ndarray:
    """Eyes (and everything else) from `eyes`, the mouth from `mouth`.

    Only a tight area around both mouth shapes is swapped, so neither frame's
    eyes can bleed in and the screen's shading stays continuous.
    """
    area = ndimage.binary_dilation(mouth_mask(eyes) | mouth_mask(mouth), iterations=5)
    soft = ndimage.gaussian_filter(area.astype(float), 1.6)[..., None]
    out = eyes.astype(float) * (1 - soft) + mouth.astype(float) * soft
    out[..., 3] = eyes[..., 3]
    return out.round().clip(0, 255).astype(np.uint8)


def scaled(frame: np.ndarray, factor: float) -> np.ndarray:
    if abs(factor - 1) < 1e-3:
        return frame
    size = (round(frame.shape[1] * factor), round(frame.shape[0] * factor))
    return fit_to(frame, size)


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
    built = {"idle": base}
    for name, frame in named.items():
        built[name] = swap_face(base, frame, mask)
        save(built[name], name)

    # Talking with other moods: that mood's eyes, a talking mouth.
    mixes = {
        "happy-rest": ("happy", "idle"),
        "happy-talk-small": ("happy", "talk-small"),
        "happy-talk-o": ("happy", "talk-o"),
        "surprised-talk-small": ("surprised", "talk-small"),
        "surprised-talk-big": ("surprised", "talk-big"),
        "worried-talk-o": ("worried", "talk-o"),
    }
    for name, (eyes, mouth) in mixes.items():
        save(mix_mouth(built[eyes], built[mouth]), name)

    # Side, back and action poses, at the front frames' scale.
    sheet = split_frames(CHAR / "midi_v2_sheet.png")
    actions = split_frames(CHAR / "midi_v2_actions.png")
    assert len(sheet) == 4, len(sheet)
    assert len(actions) == 5, len(actions)
    sheet_scale = base.shape[0] / sheet[0].shape[0]
    poses = {
        "side-left": scaled(sheet[1], sheet_scale),
        "side-right": scaled(sheet[2], sheet_scale),
        "back": scaled(sheet[3], sheet_scale),
        # The moving poses were drawn with a bigger head; 0.87 gives the same
        # head width (measured through the face screen) as the side poses.
        "move-left": scaled(actions[0], 0.87),
        "move-right": scaled(actions[1], 0.87),
        "fly-right": actions[2],
        "wave": actions[3],
        "cheer": actions[4],
    }
    # Gliding toward / away from the viewer, drawn at another size: matched by
    # head width (measured by eye on the sheets), so the head stays Midi's size;
    # leaning toward the viewer makes the front one a little taller overall.
    glide = split_frames(CHAR / "midi_v2_glide.png")
    assert len(glide) == 2, len(glide)
    glide_scale = base.shape[0] * 0.98 / glide[0].shape[0]
    poses["glide-front"] = scaled(glide[0], glide_scale * 0.92)
    poses["glide-back"] = scaled(glide[1], glide_scale * 0.88 * glide[0].shape[0] / glide[1].shape[0] * poses["back"].shape[0] / (base.shape[0] * 0.98))
    for name, frame in poses.items():
        padded = np.zeros((frame.shape[0] + PAD * 2, frame.shape[1] + PAD * 2, 4), np.uint8)
        padded[PAD:-PAD, PAD:-PAD] = frame
        Image.fromarray(padded).save(OUT / f"pose-{name}.png")
    # Flying right (data flight): every frame on one shared canvas, lined up on
    # the body (best overlap with the first frame), so swapping frames never jumps.
    fly = split_frames(CHAR / "midi_v2_fly.png", min_width=30)
    assert len(fly) == 6, len(fly)
    side = max(max(frame.shape[0], frame.shape[1]) for frame in fly) + 64

    def placed(frame: np.ndarray, dx: int = 0, dy: int = 0) -> np.ndarray:
        canvas = np.zeros((side, side, 4), np.uint8)
        top = side - PAD * 2 - frame.shape[0] + dy
        left = (side - frame.shape[1]) // 2 + dx
        canvas[top : top + frame.shape[0], left : left + frame.shape[1]] = frame
        return canvas

    reference = placed(fly[0])[..., 3] > 128
    for name, frame in zip(["1", "2", "3", "4", "happy", "ouch"], fly):
        best, best_score = (0, 0), -1
        for dy in range(-PAD, PAD + 1, 2):
            for dx in range(-24, 25, 2):
                score = ((placed(frame, dx, dy)[..., 3] > 128) & reference).sum()
                if score > best_score:
                    best, best_score = (dx, dy), score
        Image.fromarray(placed(frame, *best)).save(OUT / f"fly-{name}.png")
    # Fever: only the sparkling face screen is taken from the fever drawing and
    # set into the flying pose, so the body and hands stay exactly the same.
    fly_base = np.array(Image.open(OUT / "fly-1.png"))
    fever = split_frames(CHAR / "midi_v2_fly_fever.png", min_width=30)[0]
    base_screen = visor_mask(fly_base)
    fever_screen = visor_mask(fever)
    bys, bxs = np.where(base_screen)
    fys, fxs = np.where(fever_screen)
    factor = (bys.max() - bys.min()) / (fys.max() - fys.min())
    fever_small = scaled(fever, factor)
    sys_, sxs = np.where(visor_mask(fever_small))
    dy = round((bys.min() + bys.max()) / 2 - (sys_.min() + sys_.max()) / 2)
    dx = round((bxs.min() + bxs.max()) / 2 - (sxs.min() + sxs.max()) / 2)
    layer = np.zeros_like(fly_base)
    h, w = fever_small.shape[:2]
    y0, x0 = max(dy, 0), max(dx, 0)
    layer[y0 : dy + h, x0 : dx + w] = fever_small[y0 - dy : layer.shape[0] - dy, x0 - dx : layer.shape[1] - dx][
        : layer[y0 : dy + h, x0 : dx + w].shape[0], : layer[y0 : dy + h, x0 : dx + w].shape[1]
    ]
    inner = ndimage.binary_erosion(base_screen, iterations=2)
    soft = ndimage.gaussian_filter(inner.astype(float), 0.8)[..., None]
    fever_frame = fly_base.astype(float) * (1 - soft) + layer.astype(float) * soft
    fever_frame[..., 3] = fly_base[..., 3]
    Image.fromarray(fever_frame.round().clip(0, 255).astype(np.uint8)).save(OUT / "fly-fever.png")
    print("wrote", sorted(p.name for p in OUT.glob("*.png")))


if __name__ == "__main__":
    main()
