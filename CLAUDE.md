# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## このリポジトリについて

Claude Code に関するセキュリティ・クイズ（全10問）を提供する Astro 製の静的サイト。GitHub Pages にデプロイ。JA / EN のページ内トグルに対応。シェアカードも JA / EN 両方を `public/{share,og}/[en/]` に用意し、言語によって出し分ける。

## よく使うコマンド

パッケージマネージャは pnpm。`packageManager` フィールドで pin している。

```sh
pnpm install     # 初回のみ
pnpm dev         # http://localhost:4321/claude-code-security-drill/
pnpm build       # dist/ に静的ファイル生成
pnpm preview     # build 後にローカルでプレビュー
```

OGP 画像とスコア別シェアページの再生成（Pillow 必要、Linux Noto CJK / macOS Hiragino Sans GB を自動検出）:

```sh
# 初回のみ
python3 -m venv .venv && .venv/bin/pip install Pillow

# 各スクリプトは --lang ja|en を取る。3 本セットで言語ごとに走らせる
for lang in ja en; do
  .venv/bin/python scripts/generate_og_images.py --lang $lang
  .venv/bin/python scripts/generate_cover.py --lang $lang
  .venv/bin/python scripts/generate_share_pages.py --lang $lang
done
# share/*.html / share/en/*.html の __SITE_URL__ / __REPO_URL__ を sed で置換（README 参照）
```

`scripts/_common.py` がフォント探索・出力先パス解決・翻訳辞書（`OG_STRINGS` / `COVER_STRINGS` / `SHARE_STRINGS`）・しきい値（`get_rank`）を一手に持つ。3 つの生成スクリプトはここから引いて描画する。

ローカルで OGP を視認したいとき: PNG は `open public/og/en/8.png` で直接開く。share ページの meta は `pnpm preview &` 後 `curl -s http://localhost:4321/claude-code-security-drill/share/en/8.html | grep -E '(og:|twitter:)'`。実カードを X / FB 等の見え方で確認したいときは cloudflared でトンネルして opengraph.xyz に貼る。

## アーキテクチャ

### Astro + クライアント側 i18n

ビルド成果物は完全静的（`output: 'static'`）。Astro はテンプレートとビルドパイプラインだけを担当し、**i18n は実行時クライアント側**。`/ja/` `/en/` のような言語別ルートは作らず、単一 URL でトグルする。

- `src/pages/index.astro` がルート。`Base.astro`（`<head>` / OGP / フォント）の中に `TopBar` / `IntroScreen` / `QuizScreen` / `ResultScreen` / `Footer` を並べる。
- 静的テキスト要素には `data-i18n="ui.key"` または `data-i18n-html="ui.key"` 属性を付け、`src/lib/i18n/index.ts` の `applyStaticTranslations()` が DOM を走査して `textContent` / `innerHTML` を置換する。
- 動的要素（設問、選択肢、解説、ランクメッセージ、breakdown）は `src/lib/quiz.ts` が `getTranslations()` 経由で都度引いて描画する。
- `onLangChange()` で `quiz.ts` が言語切替を購読し、現在の `screen` に応じて再描画する（途中切替えても進捗・スコアは保持）。
- 言語の永続化キーは `localStorage['ccsd:lang']`。未設定時は `navigator.language` が `en*` なら EN、それ以外は JA。

### スコア連動の Twitter カード（JA / EN 両対応）

`public/share/[en/]N.html`（N: 0..10）が OGP の `og:image` で対応する `public/og/[en/]N.png` を指し、自身は `<meta http-equiv="refresh">` でクイズ本体にリダイレクトする（`../index.html` または `../../index.html`）。

クイズ結果画面の X intent URL は `${SITE_URL}/share[/en]/${score}.html` を共有 URL として渡す。言語別ディレクトリの切替えは `src/lib/share.ts` の `buildShareUrl(score, lang)` で行い、`quiz.ts` が `getLang()` を渡す。`SITE_URL` は `astro.config.mjs` の `site` + `base` から `import.meta.env` 経由で組み立てる（`src/lib/config.ts`）。

### スコアしきい値の単一ソース化（JS 側）

しきい値（10 / 8 / 6 / 4 のランク境界）は `src/lib/rank.ts` の `getRankKey()` 1 箇所で定義。`quiz.ts` が rank キーを引き、`getTranslations().ui.ranks[key]` と `resultMessages[key]` で文字列を解決する。

Python 側は `scripts/_common.py` の `get_rank()` 1 箇所に集約済み。ランク基準を変更する場合は **JS 側 1 箇所（`rank.ts`）+ Python 側 1 箇所（`_common.py`）** の同期が必要。

### 設問データ構造

`src/lib/types.ts` の `Question` 型に従う。`ja.ts` / `en.ts` は **同じ順序で 10 件**の `questions` 配列を持つ必要がある（`answer` インデックスも同じ）。`explanation` は `<strong>`、`<br>`、`<code>`、`<pre>` を含む制限付き HTML。`scenario`（任意）は `highlight.ts` の `highlightScenario()` がエスケープ後に `SYSTEM:` と JSON キー / 文字列値のスパンを注入する非純粋関数で描画される。

## 編集時の注意

1. `data-i18n` 属性のキーは `UiStrings` の型に存在する必要がある。新しいキーを足す場合は `types.ts` の `UiStrings` インターフェイスと `ja.ts` / `en.ts` 両方を更新する。
2. `Base.astro` の `<title>` と OGP meta は JA 固定（クローラ向けの 1 言語のため）。クイズ本体の表示文言は `data-i18n` で切替わるが、`<head>` 配下は JS 実行前に読まれるため動的にしていない。シェアカード自体は `share[/en]/*.html` に各言語版があり、X/FB クローラはアクセスする URL に応じて適切な言語のカードを取得する。
3. `option` のテキストは `escapeAttr()` を通して `innerHTML` に挿入される。HTML を含めない前提。
4. `explanation` / `resultMessages` / `heroLedeHtml` / `heroTitleHtml` / `footerHtml` は HTML 含む。`<script>` や `<style>` を入れない。
5. クイズ問題数は `quiz.ts` の `TOTAL = 10` でハードコード。シェア用アセット（`public/share/0..10.html` / `public/og/0..10.png`）と整合させているため、数を変える場合は両方を再生成する。
6. デプロイは `.github/workflows/deploy.yml` が `main` push をトリガに `actions/deploy-pages` で公開する。Pages 設定は **Source: GitHub Actions** が前提。
