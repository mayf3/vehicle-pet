#!/usr/bin/env python3
"""Deterministic V2 art post-process (Goal 换图 ART_PRODUCTION stage).

Inputs are the frozen ChatGPT-route generations; outputs are the transparent
production masters consumed by scripts/generate-pack-assets.mjs. No randomness;
run twice -> byte-identical outputs.

  build_family.py     <gen png> <out master>   # white->alpha, despeckle, report cut valleys
  build_evolution.py  <gen png> <out master> <count label>
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi

FONT = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'


def white_to_alpha(path):
    im = Image.open(path).convert('RGBA')
    a = np.array(im)
    rgb = a[:, :, :3].astype(int)
    # near-white background mask, connected to the border only
    near_white = (rgb.min(axis=2) >= 240)
    lab, n = ndi.label(near_white)
    border_labels = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1])
    border_labels.discard(0)
    bg = np.isin(lab, list(border_labels))
    a[bg, 3] = 0
    # despeckle: drop tiny opaque islands (<30 px)
    solid = a[:, :, 3] > 16
    lab2, n2 = ndi.label(solid)
    sizes = np.bincount(lab2.ravel())
    sizes[0] = 0
    keep = np.isin(lab2, np.where(sizes > 30)[0])
    a[~keep] = 0
    return Image.fromarray(a)


def column_valleys(alpha, min_gap=8):
    cov = (alpha > 16).sum(axis=0)
    W = len(cov)
    runs = []
    x = 0
    while x < W:
        if cov[x] > 0:
            x0 = x
            while x < W and cov[x] > 0:
                x += 1
            runs.append((x0, x))
        else:
            x += 1
    # merge runs separated by small gaps (< min_gap) — intra-car gaps
    merged = [list(runs[0])]
    for x0, x1 in runs[1:]:
        if x0 - merged[-1][1] < min_gap:
            merged[-1][1] = x1
        else:
            merged.append([x0, x1])
    return merged


def build_family(src, dst):
    im = white_to_alpha(src)
    groups = column_valleys(np.array(im)[:, :, 3])
    print('GROUPS', groups)
    im.save(dst)
    return groups


def build_evolution(src, dst, count_label):
    im = white_to_alpha(src)
    im = im.crop(im.getbbox())
    im.thumbnail((920, 710), Image.Resampling.LANCZOS)
    out = Image.new('RGBA', (1024, 1024))
    out.alpha_composite(im, ((1024 - im.width) // 2, 285 + (710 - im.height) // 2))
    d = ImageDraw.Draw(out)
    d.text((50, 32), '1 人监管', font=ImageFont.truetype(FONT, 42), fill='#168BE8',
           stroke_width=1, stroke_fill='#F4F9FD')
    d.text((48, 86), count_label, font=ImageFont.truetype(FONT, 112), fill='#168BE8',
           stroke_width=2, stroke_fill='#F4F9FD')
    out.save(dst)


if __name__ == '__main__':
    if sys.argv[1] == 'family':
        build_family(sys.argv[2], sys.argv[3])
    else:
        build_evolution(sys.argv[2], sys.argv[3], sys.argv[4])
