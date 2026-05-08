#!/usr/bin/env python3
"""
Generate og/[en/]0.png ~ 10.png (1200x630, dark theme, score + rank).

Usage:
    python3 scripts/generate_og_images.py [--lang ja|en]
"""
import argparse
import os
from PIL import Image, ImageDraw

from _common import (
    OG_STRINGS,
    get_rank,
    load_font,
    og_message,
    og_output_dir,
    og_rank_subtitle,
)

# Color palette (mirrors the warm-dark CSS tokens, intentionally shifted off
# Anthropic's exact spec)
BG = (24, 23, 21)
GRID = (32, 31, 29)
INK = (250, 249, 245)
INK_DIM = (176, 174, 165)
INK_FAINT = (111, 109, 101)
ACCENT = (198, 99, 68)       # warm brick (Claude-Orange-inspired but distinct)
LINE = (44, 43, 40)


def make_og(score, lang, output_path):
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    strings = OG_STRINGS[lang]

    # Subtle grid lines
    for x in range(0, W, 60):
        draw.line([(x, 0), (x, H)], fill=GRID, width=1)
    for y in range(0, H, 60):
        draw.line([(0, y), (W, y)], fill=GRID, width=1)

    # Top right meta
    meta_font = load_font("mono_reg", 16, lang)
    meta_text = "claude code / 2026"
    bbox = draw.textbbox((0, 0), meta_text, font=meta_font)
    draw.text((W - 60 - (bbox[2] - bbox[0]), 52), meta_text, fill=INK_DIM, font=meta_font)

    # Horizontal divider
    draw.line([(60, 95), (W - 60, 95)], fill=LINE, width=1)

    # Brand title + clarifying subtitle so the card reads "this is a quiz"
    title_font = load_font("sans_bold", 38, lang)
    draw.text((60, 128), strings["title"], fill=INK, font=title_font)
    subtitle_font = load_font("sans_reg", 22, lang)
    draw.text((60, 182), strings["subtitle"], fill=INK_DIM, font=subtitle_font)

    # Massive score (left)
    score_font = load_font("sans_bold", 220, lang)
    score_text = f"{score}"
    score_bbox = draw.textbbox((0, 0), score_text, font=score_font)
    score_w = score_bbox[2] - score_bbox[0]
    score_h = score_bbox[3] - score_bbox[1]
    score_x = 60
    score_y = 235
    # Score number is always INK; only the rank itself carries the status color.
    draw.text((score_x, score_y), score_text, fill=INK, font=score_font)

    # /10 next to score
    out_of_font = load_font("sans_bold", 72, lang)
    out_of_text = "/10"
    out_of_x = score_x + score_w + 18
    out_of_bbox = draw.textbbox((0, 0), out_of_text, font=out_of_font)
    out_of_h = out_of_bbox[3] - out_of_bbox[1]
    out_of_y = score_y + score_h - out_of_h - 10
    draw.text((out_of_x, out_of_y), out_of_text, fill=INK_FAINT, font=out_of_font)

    # Score caption — anchors what the big number actually is
    score_label_font = load_font("sans_reg", 22, lang)
    draw.text((60, 470), strings["score_label"], fill=INK_DIM, font=score_label_font)

    # Right side: rank info
    right_x = 700
    rank_label_font = load_font("mono_reg", 18, lang)
    draw.text(
        (right_x, 240),
        f"▸ {strings['rank_label']}",
        fill=ACCENT,
        font=rank_label_font,
    )

    rank_name, rank_color = get_rank(score, lang)
    # Rank name is bumped up for legibility on small Twitter cards, but
    # auto-fits when the label is long (e.g. "Aware but Vulnerable") so it
    # never overflows the right margin.
    right_margin = W - 60
    rank_size = 42
    while True:
        rank_font = load_font("mono_bold", rank_size, lang)
        rank_bbox = draw.textbbox((0, 0), rank_name, font=rank_font)
        if right_x + (rank_bbox[2] - rank_bbox[0]) <= right_margin or rank_size <= 32:
            break
        rank_size -= 2
    draw.text((right_x, 275), rank_name, fill=rank_color, font=rank_font)

    # Per-language gloss under the rank name (e.g. 「最高ランク」for ja).
    rank_subtitle_font = load_font("sans_reg", 24, lang)
    draw.text(
        (right_x, 340),
        og_rank_subtitle(score, lang),
        fill=INK_DIM,
        font=rank_subtitle_font,
    )

    # Vertical separator
    draw.line([(right_x - 30, 260), (right_x - 30, 460)], fill=LINE, width=1)

    # Message — bumped from INK_DIM to INK and from 22 to 26 so it reads on
    # the small Twitter card crop.
    msg_font = load_font("sans_reg", 26, lang)
    draw.text((right_x, 405), og_message(score, lang), fill=INK, font=msg_font)

    # Bottom divider
    draw.line([(60, 540), (W - 60, 540)], fill=LINE, width=1)

    # CTA — outlined pill. Stays minimal/dark but reads as a button.
    cta_text = strings["cta"]
    cta_font = load_font("sans_bold", 24, lang)
    cta_bbox = draw.textbbox((0, 0), cta_text, font=cta_font)
    cta_w = cta_bbox[2] - cta_bbox[0]
    cta_h = cta_bbox[3] - cta_bbox[1]
    btn_pad_x = 28
    btn_pad_y = 14
    btn_x = 60
    btn_y = 558
    btn_w = cta_w + btn_pad_x * 2
    btn_h = cta_h + btn_pad_y * 2
    draw.rounded_rectangle(
        (btn_x, btn_y, btn_x + btn_w, btn_y + btn_h),
        radius=10,
        outline=ACCENT,
        width=2,
    )
    draw.text(
        (btn_x + btn_pad_x - cta_bbox[0], btn_y + btn_pad_y - cta_bbox[1]),
        cta_text,
        fill=INK,
        font=cta_font,
    )

    # Tagline aligned to the CTA's vertical center, replacing the old
    # "Stay paranoid..." flavor line with something more conversion-oriented.
    # Uses the sans (CJK-capable) font so the ja gloss renders correctly.
    tagline_font = load_font("sans_reg", 16, lang)
    tagline_text = strings["tagline"]
    tg_bbox = draw.textbbox((0, 0), tagline_text, font=tagline_font)
    tg_w = tg_bbox[2] - tg_bbox[0]
    tg_h = tg_bbox[3] - tg_bbox[1]
    tg_x = W - 60 - tg_w
    tg_y = btn_y + (btn_h - tg_h) // 2 - tg_bbox[1]
    draw.text((tg_x, tg_y), tagline_text, fill=INK_FAINT, font=tagline_font)

    img.save(output_path, "PNG", optimize=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", choices=["ja", "en"], default="ja")
    args = parser.parse_args()

    out_dir = og_output_dir(args.lang)
    os.makedirs(out_dir, exist_ok=True)

    for score in range(11):
        path = os.path.join(out_dir, f"{score}.png")
        make_og(score, args.lang, path)
        print(f"Generated: {path}")

    print(f"\nDone. 11 OG images created in {out_dir} (lang={args.lang})")


if __name__ == "__main__":
    main()
