(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const addClasses = (selector, classes) => {
    document.querySelectorAll(selector).forEach((el) => {
      classes.split(" ").filter(Boolean).forEach((name) => el.classList.add(name));
    });
  };

  addClasses(".hero .eyebrow", "ink-reveal");
  addClasses(".hero h1", "ink-reveal ink-delay-1");
  addClasses(".hero .hero-lead, .hero .lead", "ink-reveal ink-delay-2");
  addClasses(".hero-visual, .hero-figure", "ink-visual ink-delay-2");
  addClasses(".section h2", "ink-drip");
  addClasses(".story, .axis-card, .summary, .next-step", "ink-card");

  const targets = document.querySelectorAll(".ink-reveal, .ink-drip, .ink-card, .ink-visual");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver((entries, io) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -7% 0px",
    });

    targets.forEach((el) => observer.observe(el));
  }

  document.addEventListener("click", (event) => {
    const card = event.target.closest(".action-card");
    if (!card || reduceMotion) return;
    card.classList.remove("ink-pulse");
    requestAnimationFrame(() => card.classList.add("ink-pulse"));
    window.setTimeout(() => card.classList.remove("ink-pulse"), 620);
  });
})();
