(() => {
  const PAGE_VERSION = "2026-09-10";
  const form = document.querySelector("#worksheet-form");
  const summary = document.querySelector("#summary");
  const summaryText = document.querySelector("#summary-text");
  const nextStep = document.querySelector("#next-step");
  const formError = document.querySelector("#form-error");
  const actionGuidance = document.querySelector("#action-guidance");
  const supportNote = document.querySelector("#support-note");
  const offers = document.querySelector("#offers");
  const offerIntro = document.querySelector("#offer-intro");
  const offerList = document.querySelector("#offer-list");
  const restOffer = document.querySelector("#rest-offer");
  const restOfferLink = document.querySelector("#rest-offer-link");
  const copyStatus = document.querySelector("#copy-status");
  const copyFallback = document.querySelector("#copy-fallback");
  const copyFallbackText = document.querySelector("#copy-fallback-text");
  const beforeActionCopyStatus = document.querySelector("#copy-status-before-action");
  const beforeActionCopyFallback = document.querySelector("#copy-fallback-before-action");
  const beforeActionCopyFallbackText = document.querySelector("#copy-fallback-text-before-action");
  const blankCopyStatus = document.querySelector("#blank-copy-status");
  const blankCopyFallback = document.querySelector("#blank-copy-fallback");
  const blankCopyFallbackText = document.querySelector("#blank-copy-fallback-text");
  const example = document.querySelector("#example");
  const emitted = new Set();
  const viewedOfferIds = new Set();
  let worksheetStarted = false;
  let currentAction = "";

  const actions = {
    rest: "今夜やらなくてよいことを一つ決める、または相談できる人を一人考える。",
    change: "困っている場面と、変えてほしいことを一つずつメモする。",
    explore: "次の仕事で生かしたい経験、変えたい条件、守りたい条件を一つずつ書き出す。",
    keep: "今日はここまでで大丈夫です。気持ちが変わった日に、同じ問いを見直せます。",
  };

  // Which "今、重く感じること" theme is driving the visit changes only the
  // wording that introduces the offer, never whether it appears — that
  // decision stays with the "今日の一歩" action (see renderOffers below).
  const offerCopy = {
    work: [
      "辞めると決めなくても、今とは違う仕事内容にどんな選択肢があるのかを見ておくことはできます。",
      "求人を眺めてみるだけでも、「今の仕事で続けたい部分」と「変えたい部分」が見えてくることがあります。",
      "今すぐ応募したり、転職を決めたりする必要はありません。選択肢を知りたいときだけ、使ってみてください。",
    ],
    environment: [
      "辞めると決めなくても、会社が変わると働き方や環境がどのくらい変わるのかを見ておくことはできます。",
      "求人を眺めてみるだけでも、「今の職場に残りたい理由」と「次は変えたい条件」が見えてくることがあります。",
      "今すぐ応募したり、転職を決めたりする必要はありません。選択肢を知りたいときだけ、使ってみてください。",
    ],
    selfEvaluation: [
      "辞めると決めなくても、今の経験が外ではどんな仕事につながるのかを見ておくことはできます。",
      "求人を眺めてみるだけでも、これまで積んできたことの意外な生かし方が見えてくることがあります。",
      "今すぐ応募したり、転職を決めたりする必要はありません。選択肢を知りたいときだけ、使ってみてください。",
    ],
    default: [
      "辞めると決めなくても、次にどんな働き方があるのかを見ておくことはできます。",
      "求人を眺めてみるだけでも、「今の職場に残りたい理由」と「次は変えたい条件」が見えてくることがあります。",
      "今すぐ応募したり、転職を決めたりする必要はありません。選択肢を知りたいときだけ、使ってみてください。",
    ],
  };

  function pickOfferCopy(themes) {
    if (themes.includes("仕事内容")) return offerCopy.work;
    if (themes.includes("環境")) return offerCopy.environment;
    if (themes.includes("自己評価")) return offerCopy.selfEvaluation;
    return offerCopy.default;
  }

  // 疲労だけが選ばれている時は、「調べたい」を選んでいても休息・相談を優先する。
  function fatigueOnly(themes) {
    return themes.length === 1 && themes[0] === "疲労";
  }

  const blankSheet = () => [
    "辞めたい理由の整理メモ", "", "■ 環境", "", "", "■ 仕事内容", "", "", "■ 疲労", "", "", "■ 自己評価", "", "", "■ 今、重く感じること", "", "", "■ 今日の一歩", "",
  ].join("\n");

  function values() {
    return {
      environment: form.elements.environment.value.trim(),
      work: form.elements.work.value.trim(),
      fatigue: form.elements.fatigue.value.trim(),
      selfEvaluation: form.elements.selfEvaluation.value.trim(),
      themes: [...form.querySelectorAll('input[name="theme"]:checked')].map((input) => input.value),
    };
  }

  function memo() {
    const value = values();
    return [
      "辞めたい理由の整理メモ", "", "■ 環境", value.environment || "未記入", "", "■ 仕事内容", value.work || "未記入", "", "■ 疲労", value.fatigue || "未記入", "", "■ 自己評価", value.selfEvaluation || "未記入", "", "■ 今、重く感じること", value.themes.join("・") || "未記入", "", "■ 今日の一歩", currentAction ? actions[currentAction] : "まだ決めない",
    ].join("\n");
  }

  function source() {
    const value = new URLSearchParams(window.location.search).get("utm_source") || "unknown";
    return /^[a-zA-Z0-9_-]{1,64}$/.test(value) ? value : "unknown";
  }

  function track(event, detail = {}) {
    const key = `${event}:${detail.offer_id || ""}:${detail.copy_type || ""}`;
    if (emitted.has(key)) return;
    emitted.add(key);
    const data = JSON.stringify({ event, page_version: PAGE_VERSION, source: source(), ...detail });
    fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: data, keepalive: true }).catch(() => {});
  }

  function markStarted() {
    if (!worksheetStarted) { worksheetStarted = true; track("worksheet_start"); }
  }

  form.addEventListener("input", markStarted);
  document.querySelector("#example-link").addEventListener("click", () => { example.open = true; });
  form.addEventListener("change", (event) => {
    markStarted();
    if (event.target.name !== "theme") return;
    const unknown = form.querySelector('input[name="theme"][value="まだ分からない"]');
    const others = [...form.querySelectorAll('input[name="theme"]')].filter((input) => input !== unknown);
    if (event.target === unknown && unknown.checked) others.forEach((input) => { input.checked = false; });
    if (event.target !== unknown && event.target.checked) unknown.checked = false;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = values();
    const hasText = [value.environment, value.work, value.fatigue, value.selfEvaluation].some(Boolean);
    if (!hasText && value.themes.length === 0) { formError.hidden = false; return; }
    formError.hidden = true;
    summaryText.textContent = memo();
    summary.hidden = false;
    nextStep.hidden = false;
    summary.focus({ preventScroll: true });
    summary.scrollIntoView({ behavior: "smooth", block: "start" });
    track("summary_view");
  });

  document.querySelector("#copy-blank").addEventListener("click", () => copy(blankSheet(), "blank", blankCopyStatus, blankCopyFallback, blankCopyFallbackText));
  document.querySelector("#copy-summary").addEventListener("click", () => copy(memo(), "filled", copyStatus, copyFallback, copyFallbackText));
  document.querySelector("#copy-summary-before-action").addEventListener("click", () => copy(memo(), "filled", beforeActionCopyStatus, beforeActionCopyFallback, beforeActionCopyFallbackText));

  async function copy(text, copyType, status, fallback, fallbackText) {
    fallback.hidden = true;
    status.textContent = "";
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard_unavailable");
      await navigator.clipboard.writeText(text);
      status.textContent = "コピーしました。自分のメモに貼り付けて使えます。";
      track("copy_success", { copy_type: copyType });
    } catch {
      fallbackText.value = text;
      fallback.hidden = false;
      status.textContent = "コピー用の文章を表示しました。";
      fallbackText.focus();
      fallbackText.select();
    }
  }

  document.querySelectorAll(".action-card").forEach((button) => {
    button.addEventListener("click", () => {
      currentAction = button.dataset.action;
      document.querySelectorAll(".action-card").forEach((item) => {
        const selected = item === button;
        item.setAttribute("aria-checked", String(selected));
      });
      const themes = values().themes;
      const holdForFatigue = currentAction === "explore" && fatigueOnly(themes);
      actionGuidance.textContent = actions[currentAction];
      supportNote.hidden = !(currentAction === "rest" || holdForFatigue);
      summaryText.textContent = memo();
      renderOffers(currentAction === "explore" && !holdForFatigue, themes);
      renderRestOffer(currentAction === "rest");
    });
  });

  function validOffers() {
    const required = ["id", "name", "description", "conditions", "goodFor", "notFor", "pricing", "flow", "checkedAt", "url"];
    const list = Array.isArray(window.NATSUME_OFFERS) ? window.NATSUME_OFFERS : [];
    return list.filter((offer) => offer?.displayEnabled === true && required.every((key) => typeof offer[key] === "string" && offer[key].trim()) && isHttpsUrl(offer.url)).slice(0, 2);
  }

  function isHttpsUrl(value) { try { return new URL(value).protocol === "https:"; } catch { return false; } }

  function renderOffers(shouldShow, themes = []) {
    const approvedOffers = validOffers();
    offers.hidden = !shouldShow || approvedOffers.length === 0;
    offerList.replaceChildren();
    if (offers.hidden) return;
    offerIntro.replaceChildren(...pickOfferCopy(themes).map((line) => { const p = document.createElement("p"); p.textContent = line; return p; }));
    approvedOffers.forEach((offer) => {
      const card = document.createElement("article");
      card.className = "offer-card";
      const title = document.createElement("h3"); title.textContent = offer.name;
      const lines = [["できること", offer.description], ["利用条件", offer.conditions], ["合いやすい希望", offer.goodFor], ["対応していない希望", offer.notFor], ["料金", offer.pricing], ["利用の流れ", offer.flow], ["情報の確認日", offer.checkedAt]];
      card.append(title);
      lines.forEach(([label, value]) => { const p = document.createElement("p"); const strong = document.createElement("strong"); strong.textContent = `${label}：`; p.append(strong, document.createTextNode(value)); card.append(p); });
      const link = document.createElement("a"); link.className = "button button-primary"; link.href = offer.url; link.target = "_blank"; link.rel = "sponsored noopener";
      link.textContent = typeof offer.ctaLabel === "string" && offer.ctaLabel.trim() ? offer.ctaLabel : "ほかの働き方を見てみる";
      link.addEventListener("click", () => track("affiliate_click", { offer_id: offer.id }));
      const ctaNote = document.createElement("p"); ctaNote.className = "offer-cta-note"; ctaNote.textContent = "対象条件・料金・流れは、リンク先の公式サイトでご確認いただけます。";
      card.append(link, ctaNote); offerList.append(card);
      observeOffer(card, offer.id);
    });
    offers.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderRestOffer(shouldShow) {
    const offer = window.NATSUME_REST_OFFER;
    const show = shouldShow && offer?.displayEnabled === true &&
      typeof offer.url === "string" && isHttpsUrl(offer.url);
    restOffer.hidden = !show;
    if (!show) return;
    restOfferLink.href = offer.url;
    observeOffer(restOffer, offer.id);
    restOffer.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  restOfferLink.addEventListener("click", () => {
    if (restOffer.hidden || !restOfferLink.href) return;
    track("affiliate_click", { offer_id: "anycure-consultation" });
  });

  function observeOffer(card, offerId) {
    if (!window.IntersectionObserver) {
      viewedOfferIds.add(offerId);
      track("offer_view", { offer_id: offerId });
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || viewedOfferIds.has(offerId)) return;
      viewedOfferIds.add(offerId);
      track("offer_view", { offer_id: offerId });
      observer.disconnect();
    }, { threshold: 0.25 });
    observer.observe(card);
  }

  document.querySelectorAll("#note-link, #footer-note-link").forEach((link) => link.addEventListener("click", () => track("note_click")));
  track("page_view");
})();
