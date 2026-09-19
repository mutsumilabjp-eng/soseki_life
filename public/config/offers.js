// Public offers are deliberately empty until a program is confirmed for the
// 35+ audience and every required field is checked for this placement.
//
// Do not add a program simply because it is approved in an ASP. Confirm:
// display permission, current eligibility, pricing, flow, approved URL, and
// the date those facts were checked. The client only renders complete records.
//
// To add an offer, uncomment the block below and fill in every field. This is
// the one place affiliate URLs live — replace the "#" placeholder with the
// approved affiliate URL once it is confirmed. At most 2 offers render even
// if more are listed here (see validOffers() in app.js).
//
// window.NATSUME_OFFERS = [
//   {
//     id: "example-offer",               // stable slug; only used for anonymous view/click counts
//     name: "案件名",
//     description: "できること（1文）",
//     conditions: "利用条件",
//     goodFor: "合いやすい希望",
//     notFor: "対応していない希望",
//     pricing: "料金",
//     flow: "利用の流れ",
//     checkedAt: "2026-09-15",           // date the fields above were last confirmed
//     url: "#",                           // replace with the approved affiliate URL
//     ctaLabel: "ほかの働き方を見てみる", // optional; defaults to this low-pressure phrase
//     displayEnabled: true,               // set to false to hide without deleting the record
//   },
// ];
// Explore only. A8 partnership and affiliate link: PPC source ledger (2026-09-13).
// Provider's public eligibility/pricing and scope: checked 2026-09-19.
// The listing is not a promise of ad-conversion approval; verify the
// affiliate site's registration and latest program conditions in A8.
window.NATSUME_OFFERS = [
  {
    id: "yumecareer-agent",
    name: "ユメキャリ転職エージェント",
    description: "中途転職に向けたキャリア相談・求人紹介・書類添削・面接対策など。",
    conditions: "中途転職を考えている方。広告案件では学生・外国人雇用・高齢者雇用向けプログラム等は対象外。詳しい利用条件は公式サイトで確認してください。",
    goodFor: "今の経験を生かせる仕事や、次の職場で変えたい条件を相談したい方。",
    notFor: "現職の配置・待遇の改善相談だけをしたい方、求人紹介を希望しない方。",
    pricing: "求職者の登録・相談から内定まで無料（公式案内）。",
    flow: "無料相談の申込み → カウンセリング → 希望に応じた求人紹介・選考支援。",
    checkedAt: "2026-09-19",
    url: "https://px.a8.net/svt/ejp?a8mat=4BC8N5+8DV0YY+5PWS+BX3J6",
    ctaLabel: "対象条件と無料相談の内容を見る",
    displayEnabled: true,
  },
];

  
// Separate, opt-in consultation information for the "rest / ask for help"
// action only. Not part of the career offers, and never inferred from symptoms.
// ASP ledger: approved on 2026-07-17; current media/placement rules need periodic
// review. Provider service and prices checked on 2026-09-19.
window.NATSUME_REST_OFFER = {
  id: "anycure-consultation",
  displayEnabled: true,
  url: "https://t.afi-b.com/visit.php?a=a16622H-3532168y&p=w985745T",
};
