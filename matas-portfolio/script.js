/* Matas — load, scroll reveal, and word-by-word reveal (Constantine-style).
   Progressive enhancement only. */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* always start at the top so above-the-fold reveals fire correctly */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  /* split [data-words] elements into per-word spans so they can stagger.
     A word may be marked dim by wrapping it in {curly braces} in the source. */
  document.querySelectorAll("[data-words]").forEach((el) => {
    const raw = el.textContent.replace(/\s+/g, " ").trim();
    el.textContent = "";
    let i = 0;
    raw.split(" ").forEach((word) => {
      let dim = false;
      if (word.startsWith("{") && word.endsWith("}")) { dim = true; word = word.slice(1, -1); }
      const outer = document.createElement("span");
      outer.className = "w";
      const inner = document.createElement("span");
      inner.className = "wi" + (dim ? " dim" : "");
      inner.style.setProperty("--i", i++);
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      el.appendChild(document.createTextNode(" "));
    });
  });

  /* page-load sequence */
  requestAnimationFrame(() => document.documentElement.classList.add("loaded"));

  /* drag-to-scroll for sideways project rows (pointer + wheel) */
  document.querySelectorAll("[data-drag-scroll]").forEach((el) => {
    let down = false, startX = 0, startLeft = 0, moved = 0;
    el.addEventListener("pointerdown", (e) => {
      down = true; moved = 0;
      startX = e.clientX; startLeft = el.scrollLeft;
      el.classList.add("dragging");
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      el.scrollLeft = startLeft - dx;
    });
    const end = () => { down = false; el.classList.remove("dragging"); };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("pointerleave", end);
    /* swallow the click if it was actually a drag */
    el.addEventListener("click", (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    /* vertical wheel scrolls the row horizontally */
    el.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { el.scrollLeft += e.deltaY; e.preventDefault(); }
    }, { passive: false });
  });

  /* home only: reveal the top bar once you scroll past the hero */
  const head = document.querySelector(".site-head.autohide");
  if (head) {
    const hero = document.querySelector(".hero");
    let ticking = false;
    const update = () => {
      const threshold = (hero ? hero.offsetHeight : window.innerHeight) - 80;
      head.classList.toggle("shown", window.scrollY > threshold);
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  const items = document.querySelectorAll(".reveal, [data-words], .ruler, .rule, .framed, .clip");
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
  );
  items.forEach((el) => io.observe(el));

  /* belt-and-braces: reveal anything already on screen at load,
     so above-the-fold elements never wait on an observer race */
  const sweep = () => {
    const h = window.innerHeight;
    items.forEach((el) => {
      if (el.classList.contains("in")) return;
      const r = el.getBoundingClientRect();
      if (r.top < h * 0.92 && r.bottom > 0) {
        el.classList.add("in");
        io.unobserve(el);
      }
    });
  };
  window.addEventListener("load", () => requestAnimationFrame(sweep));
  requestAnimationFrame(() => requestAnimationFrame(sweep));
})();
