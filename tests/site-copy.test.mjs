import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = "https://natsume.soseki-life.workers.dev";
const pages = [
  ["index.html", "/"],
  ["articles/index.html", "/articles/"],
  ["articles/40s-career-rebuild/index.html", "/articles/40s-career-rebuild/"],
  ["articles/40s-salary-700/index.html", "/articles/40s-salary-700/"],
  ["articles/botchan-workplace-fit/index.html", "/articles/botchan-workplace-fit/"],
  ["shigoto-seiri/index.html", "/shigoto-seiri/"],
  ["privacy/index.html", "/privacy/"],
];

const seenTitles = new Set();
const seenDescriptions = new Set();
const forbiddenMeta = /(?:StoryBrand|Reader|Guide|Character|SEO|AI生成|プロンプト|仮説|ターゲット|補助線|条件交換|編集メモ|ASP管理|検証用)/i;

for (const [file, url] of pages) {
  test(`reader-facing metadata: ${file}`, () => {
    const html = readFileSync(new URL(`../public/${file}`, import.meta.url), "utf8");
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
    assert.ok(title && title.length >= 10 && title.length <= 70, "unique, readable title");
    assert.ok(description && description.length >= 35 && description.length <= 150, "specific meta description");
    assert.equal(canonical, root + url, "correct canonical");
    assert.doesNotMatch(title + description, forbiddenMeta, "editorial metadata must not reach readers");
    assert.equal((html.match(/<h1\b/g) || []).length, 1, "exactly one visible H1");
    assert.ok(!seenTitles.has(title), "no duplicated title");
    assert.ok(!seenDescriptions.has(description), "no duplicated description");
    seenTitles.add(title);
    seenDescriptions.add(description);
  });
}

test("404 must not be indexed", () => {
  const html = readFileSync(new URL("../public/404.html", import.meta.url), "utf8");
  assert.match(html, /<meta name="robots" content="noindex,follow">/);
});
