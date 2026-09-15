# 夏目｜無料整理シート

公開パスは `/`。無料で使える「辞めたい理由を、5分で整理するシート」と、同一オリジンのイベント集計Workerです。既存の `/shigoto-seiri/` も引き続き表示できます。

## 重要な運用ルール

- 入力した文章・選んだ悩み・選んだ行動は送信も保存もしない。
- `public/config/offers.js` には、媒体掲載可否・提携承認・対象条件・料金・導線・確認日を確認した案件だけを置く。現在は35歳以上を中心とする読者に広く当てはまる案件が未確定のため、空にしている。条件が変わったら表示を止めてから再確認する。
- `offers.js` に表示する案件は最大2件。`displayEnabled: true` と全必須項目が揃わない案件は表示されない。
- `public/shigoto-seiri/hero-window.webp` は既存の夏目素材 `s3_window_curtain.png` を900px・62KBへ軽量化したもの。指定のDrive原本 `01_heart_left_company_square.png` はこの実行環境からバイナリ取得できなかったため、同じ夏目素材群の代替を使っている。取得できたら同名WebPへ置き換える。
- 「今日の一歩」で選んだ悩みのテーマ（仕事内容／環境／自己評価）に応じて、案件紹介の導入文（`#offer-intro`、`app.js`の`offerCopy`）を変える。テーマが「疲労」単独の時は、「調べたい」を選んでいても案件は表示せず、休息・相談の注記を優先する（`fatigueOnly()`）。この判定はブラウザ内のメモリだけで完結し、送信・保存はしない。
- フッターの note・Threads リンクにはファビコン画像を添えている（`public/shigoto-seiri/icons/note.png` / `threads.png`、各公式ドメインの favicon を32pxに縮小して自己ホスト）。CSP（`img-src 'self' data:'`）を満たすため外部ドメインの画像は読み込まない。

## 案件の判断（2026年9月10日）

- 20代限定の猫の手AGENT、主対象が35歳以下のRemoful、23〜35歳限定のtype女性の転職エージェントは、このページの読者と合わないため掲載しない。
- IT求人ナビ フリーランスは、35〜49歳の経験者かつ対象12エリアという条件に限れば候補になる。ただし、全読者向けのページに置く案件ではない。エンジニア経験者向けの別ページと投稿導線を作ってから検討する。
- サクキャリマッチは35〜39歳（1都3県では40〜49歳も）の候補になり得るが、ブリッジページ規約と公式情報が未確認のため掲載しない。
- 弁護士法人ガイア法律事務所の退職代行と円満退職ユニオン等は、退職の意思が固く、本人が代行を必要としている人だけに向く。気持ちを整理するこのページには置かない。別の高意図ページで、条件・料金・承認条件を再確認してから扱う。
- 現時点では、35歳以上の幅広い転職・キャリアアップ読者に適合し、掲載要件まで確認できた案件はない。

## 案件の再確認（2026年9月15日）

Notion「転職系ASP案件DB」（`夏目｜Threads｜新正本` 配下）を確認。quietworksmtm PPC案件管理DBからのコピー21件＋A8提携申請ログ27件、計48件のうち：

- 大半は「申請済み・承認未確認」（実際の可否は`ppc-approved-to-db`スキルでASP実画面を見ないと分からない）か、職種特化（薬剤師・看護師・医師・司法書士等）や年齢限定（20代・23〜35歳等）で、この幅広い読者ページには合わない。
- **ユメキャリ転職エージェント**（新規カウンセリング13,000円、対象は中途のみで学生・外国人雇用・高齢者雇用向けプログラムは除外、提携済み・リスティング一部OK）は、年齢帯を狭く区切っていない一般の中途転職エージェントで、他候補より合いそうに見える。ただし「高齢者雇用」除外の具体的な線引き、リスティング可の条件詳細、掲載可否の逐語条件は未確認。掲載前に必ずA8管理画面の実際の規約・対象条件・確認日を取得すること（[[feedback_ppc_listing_terms_verbatim_20260905]]の通り、要約せず原文をそのまま転記する）。
- 退職代行系（円満退職ユニオン等、リスティングOK）は前回同様、退職の意思がまだ固まっていない読者には向かないため見送り。
- 結論：即掲載できる案件はまだない。ユメキャリ転職エージェントの実画面確認を次のアクションとして残す。

## ローカル確認

依存パッケージは追加していない。Worker単体テストはNode標準機能で実行できる。

```sh
cd /Users/mutsumi/AI_WorkSpace/_SNS/accounts/natsume_career/free-sheet
node --test tests/worker.test.mjs
```

静的画面だけ確認する場合:

```sh
cd /Users/mutsumi/AI_WorkSpace/_SNS/accounts/natsume_career/free-sheet/public
python3 -m http.server 8788
```

## プロフィールに設定するリンク

公開後、各媒体のプロフィールには次のURLを設定する。`utm_source` だけを送るため、個別動画や個人を追跡しない。

- Threads: `https://<公開ドメイン>/?utm_source=threads`
- YouTube Shorts: `https://<公開ドメイン>/?utm_source=youtube_shorts`
- TikTok: `https://<公開ドメイン>/?utm_source=tiktok`
- Instagram: `https://<公開ドメイン>/?utm_source=instagram`

プロフィールの実更新は外部公開作業のため、このプロジェクトからは行わない。

## Cloudflareへ初回公開する時

このリポジトリにはWranglerを追加していない。既存のCloudflare認証環境で、以下を一度だけ実行する。

```sh
cd /Users/mutsumi/AI_WorkSpace/_SNS/accounts/natsume_career/free-sheet
npx wrangler d1 create natsume-free-sheet-events
# 表示されたdatabase_idをwrangler.tomlのプレースホルダーへ設定
npx wrangler d1 migrations apply natsume-free-sheet-events --remote
npx wrangler deploy
```

公開前に、`/shigoto-seiri/`、`/privacy/`、`POST /api/events` を実機で確認する。デプロイは外部公開とD1作成を伴うため、この作業では実行していない。
