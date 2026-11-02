"""برش یک تصویر دوتایی (دو پنل عمودی با جداکنندهٔ سیاه) به دو کاور جداگانه.
اجرا: python scripts/slice-pair.py <pair.png> <left-out.webp> <right-out.webp>
"""
import sys

import numpy as np
from PIL import Image


def dark_runs(v, th=0.85):
    runs, s = [], None
    for i, x in enumerate(v):
        if x > th and s is None:
            s = i
        if x <= th and s is not None:
            runs.append((s, i - 1))
            s = None
    if s is not None:
        runs.append((s, len(v) - 1))
    return runs


src, left_out, right_out = sys.argv[1:4]
img = Image.open(src).convert('RGB')
a = np.asarray(img).astype(int)
w, h = img.size
cols = (a.sum(axis=2) < 45).mean(axis=0)
runs = dark_runs(cols)
mid = min((r for r in runs if 0.3 * w < r[0] < 0.7 * w), key=lambda r: abs((r[0] + r[1]) / 2 - w / 2))
left_edge = max([r[1] + 1 for r in runs if r[1] < 0.1 * w] or [0])
right_edge = min([r[0] for r in runs if r[0] > 0.9 * w] or [w])
rows = (a.sum(axis=2) < 45).mean(axis=1)
top = max([r[1] + 1 for r in dark_runs(rows) if r[1] < 0.1 * h] or [0])
bottom = min([r[0] for r in dark_runs(rows) if r[0] > 0.9 * h] or [h])
pad = 3
img.crop((left_edge + pad, top + pad, mid[0] - pad, bottom - pad)).save(left_out, 'WEBP', quality=84)
img.crop((mid[1] + 1 + pad, top + pad, right_edge - pad, bottom - pad)).save(right_out, 'WEBP', quality=84)
print('mid', mid, 'edges', left_edge, right_edge, top, bottom)
