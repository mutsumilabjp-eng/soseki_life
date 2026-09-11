# Current state

- Audience: 35歳以上を中心に、退職・転職・キャリアアップを考えるが結論を急がない人。
- The public worksheet remains an independent, registration-free tool. It does not diagnose or recommend changing jobs.
- Public affiliate offers are disabled. Do not re-enable an offer until its eligibility, placement rule, price, flow, approved URL, and check date are verified for this page.
- The next suitable monetization tests are separate high-intent routes: experienced engineers aged 35–49 in eligible areas, and people whose resignation decision is already firm. Neither belongs on this broad worksheet.
- 2026-09-10 verification: Node worker tests, JavaScript syntax checks, empty-offer assertion, and a local browser preview passed. Rerun the listed checks after any further changes.
- The specified Drive source `01_heart_left_company_square.png` was located and verified. The Drive connector currently returns a protected file reference rather than a workspace path; its raw public download and browser download route are blocked in this environment. `hero-window.webp` remains the same-style temporary asset until the original can be materialized locally.
- 2026-09-10 Notion正本を再確認: 中心読者は「転職・退職・職場への違和感があるが、まだ結論を出し切れていない人」。キャリアアップは外の選択肢を調べる段階の一つとして扱い、夏目が診断・断定をしない方針を維持する。
- T03比較版A/B/Cをレンダーし、機械検証・接触シートを完了。結果は `T03_COMPARISON_REPORT.md`。全版53.55秒のため、投稿用30〜40秒目安は未達。
- T05の初回投稿文と媒体別導線は `T05_POST_PACKAGE_001.md`。C版から37.30秒の投稿用MP4を作成し、H.264/AAC・1080×1920・30fps・平均音量-20.0dBを確認済み。公開ドメイン設定と人によるスマホ通し確認まで投稿・予約は行わない。
- T06のCloudflare制作管理基盤を `_SNS/accounts/natsume_career/studio/` に追加。D1、R2、Queue、仕様ハッシュ、承認済み版の固定、月5,000円の予約上限、R2へのレンダー仕様出力までを実装した。外部リソースの作成・デプロイ・Container実行は未実施。
- T08の制作台帳として、退職・転職・職場違和感を主軸に、キャリアアップを外の選択肢の一つとして扱う12本分の企画を `../studio/plans/initial-12.json` に作成した。すべて無料シートへの導線だけを持ち、未確認の案件は含めない。原典の場面・引用は各制作時に出典確認が必要。
- 2026-09-11: Cloudflare Workers Static Assets とD1で公開した。URLは `https://natsume-free-sheet.furusato-97a.workers.dev/shigoto-seiri/`、プライバシー説明は `/privacy/`。D1 `natsume-free-sheet-events` をAPACに1件だけ作成し、`0001_create_daily_events.sql` を適用済み。新規の有料契約は追加していない。
- 2026-09-11: 無料シートのデザインを、紙色・明朝見出し・朱の最小アクセントへ整理した。上位レビューの指摘を受け、開始ボタンをフォームへ直行、整理メモを先にコピー可能、空欄コピーの結果表示をフォーム直下、補助文の読み上げ関連付け、横幅計算の撤去を反映した。承認済み案件は引き続きゼロで、案件欄は公開中も非表示。
- 2026-09-11: 公開後に `/shigoto-seiri/` と `/privacy/` が200、拒否イベントが400、許可済みの検証イベントが204を返すことを確認した。D1には `source=verification` の `page_view` が1件だけ入っている。上位モデルの最終確認では、幅320・390・768・1440pxに公開を止めるP1はなかった。SafariとVoiceOverの実機確認は未実施。
