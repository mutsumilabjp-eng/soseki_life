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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/events") {
      return handleEvent(request, env);
    }

    // The short profile URL is the worksheet itself. Keep the asset files in
    // their existing directory, but serve its document when someone opens /.
    const isHome = url.pathname === "/";
    const assetRequest = isHome
      ? new Request(new URL("/shigoto-seiri/", url), request)
      : request;
    const response = await env.ASSETS.fetch(assetRequest);

    if (isHome && (response.headers.get("Content-Type") || "").includes("text/html")) {
      const html = await response.text();
      const enriched = html.replace("<section class=\"section about\"", `${articleSection()}\n      <section class=\"section about\"`);
      return withSecurityHeaders(new Response(enriched, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      }));
    }

    return withSecurityHeaders(response);
  },
};

function articleSection() {
  return `<section class="section about" aria-labelledby="readings-title">
        <p class="section-kicker">読みもの</p>
        <h2 id="readings-title">40代の仕事を、<br>文学とデータから。</h2>
        <p>辞めるか残るかを急いで決める前に。夏目漱石の作品や生涯、公開統計を補助線に、仕事の迷いを分けて考える記事です。</p>
        <p><a class="article-link" href="/articles/40s-career-rebuild/">40歳、出世するか、生き直すかを考える <span aria-hidden="true">→</span></a></p>
        <p><a class="article-link" href="/articles/40s-salary-700/">年収700万円を手放すのが怖い。40歳の転職を条件交換として考える <span aria-hidden="true">→</span></a></p>
        <p><a class="article-link" href="/articles/botchan-workplace-fit/">『坊っちゃん』から考える会社との相性 <span aria-hidden="true">→</span></a></p>
        <p><a class="article-link" href="/articles/">読みものをすべて見る <span aria-hidden="true">→</span></a></p>
      </section>`;
}

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
    // Client-side features must keep working if statistics collection is unavailable.
    return json({ error: "event_unavailable" }, 503);
  }

  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
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
  headers.set("Content-Security-Policy", "default-src 'self'; base-uri 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'");
  headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=()");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
