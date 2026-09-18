const EVENT_NAMES = new Set([
  "page_view",
  "worksheet_start",
  "summary_view",
  "copy_success",
  "offer_view",
  "affiliate_click",
  "note_click",
]);

const COPY_TYPES = new Set(["", "blank", "filled"]);
const SAFE_VALUE = /^[a-zA-Z0-9_-]{0,64}$/;
const PAGE_VERSION = /^20\d{2}-\d{2}-\d{2}$/;
const JSON_HEADERS = { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store" };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_CONTACT_FROM = "夏目｜soseki_life <onboarding@resend.dev>";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/events") {
      return handleEvent(request, env);
    }

    if (url.pathname === "/api/contact") {
      return withSecurityHeaders(await handleContact(request, env));
    }

    const response = await env.ASSETS.fetch(request);
    return withSecurityHeaders(response);
  },
};

async function handleEvent(request, env) {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405, { Allow: "POST" });
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 4096) return json({ error: "payload_too_large" }, 413);

  let payload;
  try {
    const body = await request.text();
    if (body.length > 4096) return json({ error: "payload_too_large" }, 413);
    payload = JSON.parse(body);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const eventName = typeof payload?.event === "string" ? payload.event : "";
  const pageVersion = typeof payload?.page_version === "string" ? payload.page_version : "";
  const source = safeValue(payload?.source);
  const offerId = safeValue(payload?.offer_id);
  const copyType = typeof payload?.copy_type === "string" ? payload.copy_type : "";

  const offerEvent = eventName === "offer_view" || eventName === "affiliate_click";
  if (!EVENT_NAMES.has(eventName) || !PAGE_VERSION.test(pageVersion) || !COPY_TYPES.has(copyType) || (offerEvent && !offerId)) {
    return json({ error: "invalid_event" }, 400);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO daily_events (event_date, event_name, page_version, source, offer_id, copy_type, event_count)
       VALUES (?, ?, ?, ?, ?, ?, 1)
       ON CONFLICT(event_date, event_name, page_version, source, offer_id, copy_type)
       DO UPDATE SET event_count = event_count + 1`,
    )
      .bind(jstDate(), eventName, pageVersion, source, offerId, copyType)
      .run();
  } catch {
    return json({ error: "event_unavailable" }, 503);
  }

  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

/**
 * お問い合わせフォームの受け口。
 *
 * Cloudflare Secret（`npx wrangler secret put ...`。コード・Gitには実値を置かない）:
 *   - RESEND_API_KEY   … Resend の API キー。必須。
 *   - CONTACT_TO_EMAIL … 通知の宛先メールアドレス。必須。ページにもコードにも表示しない。
 * 環境変数（wrangler.toml [vars]。機密ではない）:
 *   - CONTACT_FROM_EMAIL … 任意。差出人表示。未設定なら DEFAULT_CONTACT_FROM。
 */
async function handleContact(request, env) {
  if (request.method !== "POST") {
    return contactPage("送信できませんでした", "<p>フォームの形式が不正です。もう一度お試しください。</p>", 405);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return contactPage("送信できませんでした", "<p>フォームの形式が不正です。もう一度お試しください。</p>", 400);
  }
  const field = (name) => (form.get(name) ?? "").toString().trim();

  // ハニーポット（人間には見えない項目。入力があれば bot とみなし、成功したように見せて終える）
  if (field("company_website")) {
    return contactPage("送信しました", "<p>お問い合わせを受け付けました。</p>");
  }

  const name = field("name");
  const email = field("email");
  const message = field("message");

  if (!name || !email || !message) {
    return contactPage("送信できませんでした", "<p>お名前・メールアドレス・お問い合わせ内容は必須です。</p>", 400);
  }
  if (!EMAIL_PATTERN.test(email)) {
    return contactPage("送信できませんでした", "<p>メールアドレスの形式をご確認ください。</p>", 400);
  }
  if (name.length > 100 || email.length > 254 || message.length > 5000) {
    return contactPage("送信できませんでした", "<p>入力が長すぎます。文字数を減らして再度お試しください。</p>", 400);
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL) {
    return contactPage("送信を完了できませんでした", "<p>送信先が未設定です。しばらくしてから再度お試しください。</p>", 503);
  }

  const fromEmail = (env.CONTACT_FROM_EMAIL || DEFAULT_CONTACT_FROM).trim();
  const text = [`夏目｜soseki_life お問い合わせ`, `お名前: ${name}`, `メール: ${email}`, "", message].join("\n");

  let sent;
  try {
    sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `【夏目｜soseki_life】お問い合わせ（${name}様）`,
        text,
      }),
    });
  } catch {
    sent = null;
  }
  if (!sent || !sent.ok) {
    return contactPage("送信できませんでした", "<p>送信処理に失敗しました。時間をおいて再度お試しください。</p>", 502);
  }

  return contactPage("送信しました", "<p>お問い合わせをお送りいただき、ありがとうございます。内容を確認のうえ、いただいたメールアドレス宛にご連絡します。</p>");
}

function contactPage(title, bodyHtml, status = 200) {
  return new Response(
    `<!doctype html><html lang="ja"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width, initial-scale=1">` +
      `<meta name="robots" content="noindex,nofollow"><title>${title}｜夏目</title>` +
      `<link rel="stylesheet" href="/shigoto-seiri/styles.css"></head>` +
      `<body><main><section class="section privacy-page"><h1>${title}</h1>${bodyHtml}` +
      `<p><a class="text-link" href="/privacy/">プライバシーのページへ戻る</a></p></section></main></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
}

function safeValue(value) {
  return typeof value === "string" && SAFE_VALUE.test(value) ? value : "";
}

function jstDate() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extraHeaders } });
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", "default-src 'self'; base-uri 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: https://i.moshimo.com; object-src 'none'; script-src 'self'; style-src 'self'");
  headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=()");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
