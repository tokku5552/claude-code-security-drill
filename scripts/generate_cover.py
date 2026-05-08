#!/usr/bin/env python3
"""
Generate og/[en/]cover.png — the default OGP image for the quiz home URL.

Usage:
    python3 scripts/generate_cover.py [--lang ja|en]
"""
import argparse
import os
from PIL import Image, ImageDraw

from _common import COVER_STRINGS, load_font, og_output_dir

BG = (10, 10, 10)
INK = (237, 237, 237)
INK_DIM = (136, 136, 136)
INK_FAINT = (74, 74, 74)
ACCENT = (255, 77, 61)
LINE = (35, 35, 35)

COLOR_BY_ROLE = {"INK": INK, "ACCENT": ACCENT, "INK_DIM": INK_DIM, "INK_FAINT": INK_FAINT}


def make_cover(lang, output_path):
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Subtle grid
    for x in range(0, W, 60):
        draw.line([(x, 0), (x, H)], fill=(20, 20, 20), width=1)
    for y in range(0, H, 60):
        draw.line([(0, y), (W, y)], fill=(20, 20, 20), width=1)

    # Top badge
    badge_font = load_font("mono_bold", 18, lang)
    draw.text((60, 50), "● SECURITY.DRILL // 001", fill=ACCENT, font=badge_font)

    meta_font = load_font("mono_reg", 16, lang)
    meta_text = "claude code / 2026"
    bbox = draw.textbbox((0, 0), meta_text, font=meta_font)
    draw.text((W - 60 - (bbox[2] - bbox[0]), 52), meta_text, fill=INK_DIM, font=meta_font)

    draw.line([(60, 95), (W - 60, 95)], fill=LINE, width=1)

    # Main title — large, multi-segment, multi-line
    title_font = load_font("sans_bold", 88, lang)
    title_lines = COVER_STRINGS[lang]["title_lines"]
    line_y_start = 160
    line_height = 110
    for line_idx, segments in enumerate(title_lines):
        x = 60
        y = line_y_start + line_idx * line_height
        for text, color_role in segments:
            color = COLOR_BY_ROLE[color_role]
            draw.text((x, y), text, fill=color, font=title_font)
            seg_bbox = draw.textbbox((0, 0), text, font=title_font)
            x += seg_bbox[2] - seg_bbox[0]

    # Subtitle
    sub_font = load_font("sans_reg", 24, lang)
    subtitle_lines = COVER_STRINGS[lang]["subtitle_lines"]
    sub_y_start = 410
    for i, line in enumerate(subtitle_lines):
        draw.text((60, sub_y_start + i * 36), line, fill=INK_DIM, font=sub_font)

    # Bottom CTA
    draw.line([(60, 540), (W - 60, 540)], fill=LINE, width=1)

    cta_font = load_font("sans_bold", 24, lang)
    draw.text((60, 562), COVER_STRINGS[lang]["cta"], fill=INK, font=cta_font)

    site_font = load_font("mono_reg", 16, lang)
    site_text = "Stay paranoid. Stay productive."
    bbox = draw.textbbox((0, 0), site_text, font=site_font)
    draw.text((W - 60 - (bbox[2] - bbox[0]), 568), site_text, fill=INK_FAINT, font=site_font)

    img.save(output_path, "PNG", optimize=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", choices=["ja", "en"], default="ja")
    args = parser.parse_args()

    out_dir = og_output_dir(args.lang)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "cover.png")

    make_cover(args.lang, out_path)
    print(f"Generated: {out_path}")


if __name__ == "__main__":
    main()
