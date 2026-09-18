import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/index.js";

function mockEnv() {
  const writes = [];
  const assetRequests = [];
  return {
    writes,
    assetRequests,
    env: {
      ASSETS: { fetch: async (request) => { assetRequests.push(request); return new Response("asset", { headers: { "Content-Type": "text/plain" } }); } },
      DB: { prepare: () => ({ bind: (...params) => ({ run: async () => { writes.push(params); } }) }) },
    },
  };
}

test("records only an allowed event and never stores free-form input", async () => {
  const { env, writes } = mockEnv();
  const response = await worker.fetch(new Request("https://example.test/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "copy_success", page_version: "2026-09-10", source: "youtube", copy_type: "filled", notes: "会社名を含む文章" }) }), env);
  assert.equal(response.status, 204);
  assert.deepEqual(writes[0].slice(1), ["copy_success", "2026-09-10", "youtube", "", "filled"]);
  assert.equal(JSON.stringify(writes).includes("会社名"), false);
});

test("rejects invalid events and oversized payloads", async () => {
  const { env, writes } = mockEnv();
  const invalid = await worker.fetch(new Request("https://example.test/api/events", { method: "POST", body: JSON.stringify({ event: "free_text", page_version: "2026-09-10", source: "youtube" }) }), env);
  assert.equal(invalid.status, 400);
  const large = await worker.fetch(new Request("https://example.test/api/events", { method: "POST", body: "x".repeat(4097) }), env);
  assert.equal(large.status, 413);
  assert.equal(writes.length, 0);
});

test("requires a safe offer ID for offer events", async () => {
  const { env, writes } = mockEnv();
  const missingId = await worker.fetch(new Request("https://example.test/api/events", { method: "POST", body: JSON.stringify({ event: "offer_view", page_version: "2026-09-10" }) }), env);
  const unsafeId = await worker.fetch(new Request("https://example.test/api/events", { method: "POST", body: JSON.stringify({ event: "affiliate_click", page_version: "2026-09-10", offer_id: "<script>" }) }), env);
  assert.equal(missingId.status, 400);
  assert.equal(unsafeId.status, 400);
  assert.equal(writes.length, 0);
});

test("sets security headers while serving static assets", async () => {
  const { env } = mockEnv();
  const response = await worker.fetch(new Request("https://example.test/shigoto-seiri/"), env);
  assert.match(response.headers.get("Content-Security-Policy"), /default-src 'self'/);
  assert.equal(response.headers.get("X-Frame-Options"), "DENY");
});

test("serves the worksheet at the short root URL", async () => {
  const { env, assetRequests } = mockEnv();
  const response = await worker.fetch(new Request("https://example.test/?utm_source=threads"), env);
  assert.equal(response.status, 200);
  assert.equal(new URL(assetRequests[0].url).pathname, "/shigoto-seiri/");
  assert.equal(new URL(assetRequests[0].url).search, "");
});

function contactForm(fields) {
  const body = new URLSearchParams(fields);
  return new Request("https://example.test/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

test("contact form silently accepts honeypot submissions without sending mail", async () => {
  const { env } = mockEnv();
  env.RESEND_API_KEY = "test-key";
  env.CONTACT_TO_EMAIL = "owner@example.test";
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; return new Response("{}", { status: 200 }); };
  try {
    const response = await worker.fetch(
      contactForm({ name: "spam", email: "a@a.test", message: "hi", company_website: "http://spam.example" }),
      env,
    );
    assert.equal(response.status, 200);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("contact form rejects missing fields and bad email without calling Resend", async () => {
  const { env } = mockEnv();
  env.RESEND_API_KEY = "test-key";
  env.CONTACT_TO_EMAIL = "owner@example.test";
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; return new Response("{}", { status: 200 }); };
  try {
    const missing = await worker.fetch(contactForm({ name: "", email: "a@a.test", message: "hi" }), env);
    assert.equal(missing.status, 400);
    const badEmail = await worker.fetch(contactForm({ name: "n", email: "not-an-email", message: "hi" }), env);
    assert.equal(badEmail.status, 400);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("contact form sends via Resend with reply_to set to the sender and hides the destination address", async () => {
  const { env } = mockEnv();
  env.RESEND_API_KEY = "test-key";
  env.CONTACT_TO_EMAIL = "owner@example.test";
  const originalFetch = globalThis.fetch;
  let sentBody = null;
  globalThis.fetch = async (input, init) => {
    sentBody = JSON.parse(init.body);
    return new Response("{}", { status: 200 });
  };
  try {
    const response = await worker.fetch(
      contactForm({ name: "読者", email: "reader@example.test", message: "質問があります" }),
      env,
    );
    assert.equal(response.status, 200);
    assert.equal(sentBody.to[0], "owner@example.test");
    assert.equal(sentBody.reply_to, "reader@example.test");
    assert.match(sentBody.from, /soseki_life/);
    const html = await response.text();
    assert.equal(html.includes("owner@example.test"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("contact form refuses to send when the destination is not configured", async () => {
  const { env } = mockEnv();
  const response = await worker.fetch(contactForm({ name: "n", email: "a@a.test", message: "hi" }), env);
  assert.equal(response.status, 503);
});
