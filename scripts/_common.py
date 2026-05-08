"""Shared helpers for the OGP/share-page generators.

Provides:
  - cross-platform font fallback (Linux Noto / macOS Hiragino+Helvetica+Menlo)
  - canonical paths for public/og and public/share
  - per-language string tables consumed by the three generators
"""
import os
from PIL import ImageFont

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(REPO_ROOT, "public")

# Each role maps to (path, ttc_index) candidates, tried in order.
# Index is 0 for non-TTC files. The CJK fonts (Noto CJK / Hiragino W6) are used
# for both ja and en because they cover the symbols used in the layout (→, ▸, ●)
# while pure-Latin fonts like Helvetica are missing several of those glyphs.
_FONT_CANDIDATES = {
    "sans_bold": [
        ("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", 0),
        ("/System/Library/Fonts/Hiragino Sans GB.ttc", 2),
    ],
    "sans_reg": [
        ("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", 0),
        ("/System/Library/Fonts/Hiragino Sans GB.ttc", 0),
    ],
    "mono_bold": [
        ("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 0),
        ("/System/Library/Fonts/Menlo.ttc", 1),
    ],
    "mono_reg": [
        ("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 0),
        ("/System/Library/Fonts/Menlo.ttc", 0),
    ],
}


def load_font(role, size, lang="ja"):
    """Resolve a font for the given role. lang is accepted for forward
    compatibility but currently the same font chain serves both ja and en.
    """
    del lang  # unused for now; reserved for future per-language tweaks
    for path, idx in _FONT_CANDIDATES[role]:
        if os.path.exists(path):
            return ImageFont.truetype(path, size, index=idx)
    raise FileNotFoundError(
        f"No font found for role={role}. Tried: {_FONT_CANDIDATES[role]}"
    )


def og_output_dir(lang):
    base = os.path.join(PUBLIC_DIR, "og")
    return os.path.join(base, "en") if lang == "en" else base


def share_output_dir(lang):
    base = os.path.join(PUBLIC_DIR, "share")
    return os.path.join(base, "en") if lang == "en" else base


def lang_url_segment(lang):
    """URL path segment for OGP/share URLs, e.g. '/en' or ''."""
    return "/en" if lang == "en" else ""


def share_redirect_path(lang):
    """Relative path from share/[en/]N.html back to the quiz root."""
    return "../../index.html" if lang == "en" else "../index.html"


def get_rank(score, lang="ja"):
    """Returns (rank_name, rgb_tuple) for a given score.
    Colors are softened (Anthropic-style warm palette) to match the in-page UI.
    """
    SAFE = (122, 171, 135)    # softer green
    WARN = (201, 146, 63)     # softer amber
    DANGER = (196, 86, 75)    # warmer brick (replaces neon red)
    if score == 10:
        return ("Security Sentinel", SAFE)
    if score >= 8:
        return ("Cautious Operator", SAFE)
    if score >= 6:
        return ("Aware but Vulnerable", WARN)
    if score >= 4:
        return ("At Risk", DANGER)
    return ("High Exposure", DANGER)


# OG card per-score message + brand title + bottom CTA
OG_STRINGS = {
    "ja": {
        "title": "Claude Codeセキュリティ理解度チェック",
        "score_label": "セキュリティスコア",
        "rank_label": "RANK",
        "rank_subtitles": {
            10: "最高ランク",
            8: "上位ランク",
            6: "中位ランク",
            4: "要注意ランク",
            0: "要復習ランク",
        },
        "messages": {
            10: "完璧でした。",
            8: "基本姿勢は身についています。",
            6: "基礎は理解。少し盲点があります。",
            4: "復習をおすすめします。",
            0: "見直しが必要です。",
        },
        "cta": "あなたも挑戦する →",
        "tagline": "Claude Codeでセキュリティ感覚を鍛える",
    },
    "en": {
        "title": "Claude Code Security Quiz",
        "score_label": "Security Score",
        "rank_label": "RANK",
        "rank_subtitles": {
            10: "Top tier",
            8: "Strong",
            6: "Mixed",
            4: "At risk",
            0: "Needs review",
        },
        "messages": {
            10: "Perfect. Pass it on.",
            8: "Solid instincts.",
            6: "Basics covered, gaps remain.",
            4: "Worth reviewing.",
            0: "Worth a careful re-read.",
        },
        "cta": "Take the drill →",
        "tagline": "Sharpen your security instincts",
    },
}


def _og_threshold_pick(score, table):
    for threshold in (10, 8, 6, 4, 0):
        if score >= threshold:
            return table[threshold]
    return table[0]


def og_message(score, lang):
    return _og_threshold_pick(score, OG_STRINGS[lang]["messages"])


def og_rank_subtitle(score, lang):
    return _og_threshold_pick(score, OG_STRINGS[lang]["rank_subtitles"])


# Cover-image strings. Title is a list of (segment, color_role) pairs per line.
COVER_STRINGS = {
    "ja": {
        "title_lines": [
            [("便利と", "INK"), ("危険", "ACCENT"), ("は、", "INK")],
            [("紙一重。", "INK")],
        ],
        "subtitle_lines": [
            "Claude Codeを使うすべての人のための",
            "セキュリティ・クイズ — 全10問・約7分",
        ],
        "cta": "あなたのスコアは？ →",
    },
    "en": {
        "title_lines": [
            [("Useful and ", "INK"), ("dangerous", "ACCENT")],
            [("are a hair apart.", "INK")],
        ],
        "subtitle_lines": [
            "A security quiz for everyone",
            "who uses Claude Code — 10 questions, ~7 min",
        ],
        "cta": "What's your score? →",
    },
}


# Share-page (HTML) strings.
SHARE_STRINGS = {
    "ja": {
        "html_lang": "ja",
        "page_title": "Claude Codeセキュリティドリル — {score}/10 ({rank})",
        "og_title": "Claude Codeセキュリティドリルで {score}/10 とった！",
        "og_desc": "{rank} ランク。Claude Codeを使うすべての人のためのセキュリティ・クイズ全10問。あなたのスコアは？",
        "tw_desc": "{rank} ランク。あなたも試してみる?",
        "label": "// SHARED RESULT",
        "headline_html": 'Claude Codeセキュリティドリルで<br><span class="score">{score} / 10</span> でした',
        "rank_label": "RANK: {rank}",
        "body": "このドリルは、Claude Codeを使う人なら知っておきたいセキュリティの感覚を10問でチェックするものです。所要時間は約7分。",
        "cta": "あなたも挑戦する →",
        "repo_link": "↗ View on GitHub",
    },
    "en": {
        "html_lang": "en",
        "page_title": "Claude Code Security Drill — {score}/10 ({rank})",
        "og_title": "I scored {score}/10 on the Claude Code Security Drill!",
        "og_desc": "{rank} rank. A 10-question security quiz for everyone using Claude Code. What's your score?",
        "tw_desc": "{rank} rank. Think you can do better?",
        "label": "// SHARED RESULT",
        "headline_html": 'I scored<br><span class="score">{score} / 10</span><br>on the Claude Code Security Drill',
        "rank_label": "RANK: {rank}",
        "body": "A 10-question drill for everyone who uses Claude Code, sharpening the security instincts you'd want before something actually goes wrong. About 7 minutes.",
        "cta": "Take the drill →",
        "repo_link": "↗ View on GitHub",
    },
}
