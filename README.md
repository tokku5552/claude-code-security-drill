# Claude Code Security Drill

Claude Codeを使うすべての人のためのセキュリティ・クイズ。全10問・約7分。
JA / EN のページ内トグルに対応。

## 🚀 デプロイ手順 (GitHub Pages)

1. このリポジトリをforkまたはcloneする
2. 自分の環境に合わせて2ファイルを書き換える:
   - `astro.config.mjs` の `site` / `base`
     ```js
     site: 'https://YOUR_USER.github.io',
     base: '/YOUR_REPO',
     ```
   - `src/lib/config.ts` の `REPO_URL`（必要なら `HASHTAGS` も）
3. GitHub Pagesを有効化（Settings → Pages → **Source: GitHub Actions**）
4. `main` ブランチに push すると `.github/workflows/deploy.yml` が走り、自動でデプロイされる

## 🛠 ローカル開発

パッケージマネージャは [pnpm](https://pnpm.io/)。

```sh
pnpm install
pnpm dev      # http://localhost:4321/YOUR_REPO/ で開く
pnpm build    # dist/ に静的ファイル生成
pnpm preview  # ビルド結果のプレビュー
```

## 📂 構成

```
.
├── astro.config.mjs              # site / base / output: 'static'
├── src/
│   ├── pages/index.astro         # ルート
│   ├── layouts/Base.astro        # <head> / OGP / フォント
│   ├── components/               # TopBar / Intro / Quiz / Result / Footer
│   ├── styles/                   # tokens / chrome / intro / quiz / result
│   └── scripts/
│       ├── main.ts               # エントリ
│       ├── quiz.ts               # 状態機械
│       ├── share.ts / rank.ts / highlight.ts / config.ts / types.ts
│       └── i18n/
│           ├── index.ts          # 言語検出・適用・トグル
│           ├── ja.ts             # 全 UI 文言 + 10 設問（JA）
│           └── en.ts             # 全 UI 文言 + 10 設問（EN）
├── public/
│   ├── og/                       # JA OGP（0..10.png + cover.png）
│   ├── og/en/                    # EN OGP（0..10.png + cover.png）
│   ├── share/                    # JA スコア別シェアページ（0..10.html）
│   └── share/en/                 # EN スコア別シェアページ（0..10.html）
└── scripts/                      # OGP/シェアページの再生成用 Python（--lang ja|en）
```

シェアの仕組み:

- ユーザーがクイズ完了 → 「Xでシェア」ボタン
- スコアが 8 で言語が JA なら `share/8.html`、EN なら `share/en/8.html` の URL を X にポスト
- X クローラーが該当ページを取得し、その中の OGP meta tag を読む
- OGP は対応する `og/[en/]8.png` を指している → スコア + 言語入りの画像がタイムラインに表示される

JA / EN それぞれ専用のシェアカードを用意しているので、見ている言語のままシェアされる。

## 🛠 OGP画像とシェアページの再生成

`scripts/` の 3 本は `--lang ja|en` で言語を指定する。Linux（Noto CJK）と macOS（Hiragino Sans GB）のフォントを自動検出する。

```sh
python3 -m venv .venv && .venv/bin/pip install Pillow

# JA（既存と互換のあるカードを再生成）
.venv/bin/python scripts/generate_og_images.py --lang ja
.venv/bin/python scripts/generate_cover.py --lang ja
.venv/bin/python scripts/generate_share_pages.py --lang ja

# EN
.venv/bin/python scripts/generate_og_images.py --lang en
.venv/bin/python scripts/generate_cover.py --lang en
.venv/bin/python scripts/generate_share_pages.py --lang en
```

share ページのみ生成後に `__SITE_URL__` / `__REPO_URL__` プレースホルダを sed で置換する:

```sh
# macOS
find public/share -name "*.html" -exec sed -i '' \
  -e "s|__SITE_URL__|https://YOUR_USER.github.io/YOUR_REPO|g" \
  -e "s|__REPO_URL__|https://github.com/YOUR_USER/YOUR_REPO|g" {} \;

# Linux
find public/share -name "*.html" -exec sed -i \
  -e "s|__SITE_URL__|https://YOUR_USER.github.io/YOUR_REPO|g" \
  -e "s|__REPO_URL__|https://github.com/YOUR_USER/YOUR_REPO|g" {} \;
```

`find public/share` は `share/` 直下と `share/en/` の両方を再帰的に対象に取る。

## 🌐 言語切替

- 画面右上のトグル（`JA` / `EN`）で切替。選択は `localStorage['ccsd:lang']` に保存。
- 初回訪問時はブラウザ言語が `en*` なら EN、それ以外は JA で起動。
- URL は単一（言語ごとのルートは無し）。クイズ途中で切り替えても進捗とスコアは保持される。
- EN 訳の追加・修正は `src/lib/i18n/en.ts` を編集して `pnpm build`。
