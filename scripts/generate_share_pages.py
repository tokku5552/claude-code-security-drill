#!/usr/bin/env python3
"""
Generate share/[en/]0.html ~ 10.html — score-specific share pages.

After deployment to GitHub Pages, when these are shared on X (etc.), the
crawler reads the OGP meta tags and serves the corresponding og image.

Usage:
    python3 scripts/generate_share_pages.py [--lang ja|en]
"""
import argparse
import os

from _common import (
    SHARE_STRINGS,
    get_rank,
    lang_url_segment,
    share_output_dir,
    share_redirect_path,
)


TEMPLATE = """<!DOCTYPE html>
<html lang="{html_lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{page_title}</title>

<!-- ===== OGP / Twitter Card ===== -->
<meta property="og:type" content="website">
<meta property="og:title" content="{og_title}">
<meta property="og:description" content="{og_desc}">
<meta property="og:url" content="__SITE_URL__/share{lang_seg}/{score}.html">
<meta property="og:image" content="__SITE_URL__/og{lang_seg}/{score}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="Claude Code Security Drill">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{og_title}">
<meta name="twitter:description" content="{tw_desc}">
<meta name="twitter:image" content="__SITE_URL__/og{lang_seg}/{score}.png">

<!-- Redirect human visitors to the quiz; OGP crawlers don't follow this -->
<meta http-equiv="refresh" content="0; url={redirect_path}">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">

<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background: #0a0a0a;
    color: #ededed;
    font-family: 'Noto Sans JP', sans-serif;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    line-height: 1.7;
  }}
  .container {{
    max-width: 560px;
    text-align: center;
  }}
  .label {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.3em;
    color: #ff4d3d;
    text-transform: uppercase;
    margin-bottom: 24px;
  }}
  h1 {{
    font-size: 32px;
    font-weight: 900;
    line-height: 1.3;
    letter-spacing: -0.02em;
    margin-bottom: 16px;
  }}
  .score {{
    color: #ff4d3d;
  }}
  .rank {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.15em;
    color: #888;
    margin-bottom: 32px;
  }}
  p {{
    color: #888;
    margin-bottom: 28px;
    font-size: 15px;
  }}
  .btn {{
    display: inline-block;
    background: #ff4d3d;
    color: #0a0a0a;
    padding: 18px 36px;
    text-decoration: none;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    transition: all 0.2s;
  }}
  .btn:hover {{
    background: #ededed;
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0 #ff4d3d;
  }}
  .repo {{
    margin-top: 24px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #4a4a4a;
    letter-spacing: 0.1em;
  }}
  .repo a {{
    color: #888;
    border-bottom: 1px solid #4a4a4a;
    text-decoration: none;
  }}
  .repo a:hover {{
    color: #ff4d3d;
    border-color: #ff4d3d;
  }}
</style>
</head>
<body>
  <div class="container">
    <div class="label">{label}</div>
    <h1>{headline_html}</h1>
    <div class="rank">{rank_label}</div>
    <p>{body}</p>
    <a class="btn" href="{redirect_path}">{cta}</a>
    <div class="repo">
      <a href="__REPO_URL__" target="_blank" rel="noopener noreferrer">{repo_link}</a>
    </div>
  </div>
</body>
</html>
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", choices=["ja", "en"], default="ja")
    args = parser.parse_args()

    out_dir = share_output_dir(args.lang)
    os.makedirs(out_dir, exist_ok=True)

    s = SHARE_STRINGS[args.lang]
    lang_seg = lang_url_segment(args.lang)
    redirect = share_redirect_path(args.lang)

    for score in range(11):
        rank, _ = get_rank(score, args.lang)
        html = TEMPLATE.format(
            html_lang=s["html_lang"],
            page_title=s["page_title"].format(score=score, rank=rank),
            og_title=s["og_title"].format(score=score, rank=rank),
            og_desc=s["og_desc"].format(score=score, rank=rank),
            tw_desc=s["tw_desc"].format(score=score, rank=rank),
            label=s["label"],
            headline_html=s["headline_html"].format(score=score, rank=rank),
            rank_label=s["rank_label"].format(score=score, rank=rank),
            body=s["body"],
            cta=s["cta"],
            repo_link=s["repo_link"],
            score=score,
            lang_seg=lang_seg,
            redirect_path=redirect,
        )
        path = os.path.join(out_dir, f"{score}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"Generated: {path}")

    print(f"\nDone. 11 share pages created in {out_dir} (lang={args.lang})")
    print("NOTE: Replace __SITE_URL__ and __REPO_URL__ with your actual GitHub Pages URL.")


if __name__ == "__main__":
    main()
