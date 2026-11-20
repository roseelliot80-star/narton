(function () {
  "use strict";

  // Keep the same links usable in an extracted folder and on a static web host.
  if (location.protocol === "file:") {
    document.querySelectorAll("a[href]").forEach(function (link) {
      const href = link.getAttribute("href");
      if (href.startsWith("#")) return;
      const dest = new URL(href, location.href);
      if (dest.protocol === "file:" && dest.pathname.endsWith("/")) {
        dest.pathname += "index.html";
        link.href = dest.href;
      }
    });
  }

  const menu = document.querySelector(".mobile-menu");
  if (menu) {
    document.addEventListener("click", function (event) {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menu.open) {
        menu.open = false;
        menu.querySelector("summary").focus();
      }
    });
  }

  const gallery = document.querySelector("[data-gallery]");
  if (gallery) {
    const stageLink = gallery.querySelector(".gallery-stage");
    const largeImage = stageLink.querySelector("img");
    const caption = gallery.querySelector("figcaption");
    const controls = Array.from(gallery.querySelectorAll("[data-preview-caption]"));
    controls.forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        const activeURL = link.href;
        largeImage.src = activeURL;
        largeImage.alt = link.dataset.previewAlt;
        stageLink.href = activeURL;
        stageLink.setAttribute("aria-label", "Open the full preview of " + link.dataset.previewTitle);
        caption.textContent = link.dataset.previewCaption;
        controls.forEach(function (control) {
          if (control === link) control.setAttribute("aria-current", "true");
          else control.removeAttribute("aria-current");
        });
      });
    });
  }

  const catalog = document.querySelector("[data-catalog]");
  if (!catalog) return;
  const tools = catalog.querySelector(".catalog-tools");
  const input = tools.querySelector("input[type=search]");
  const buttons = Array.from(tools.querySelectorAll("[data-filter]"));
  const cards = Array.from(catalog.querySelectorAll("[data-search]"));
  const counter = catalog.querySelector("[data-count]");
  const noResults = catalog.querySelector(".no-results");
  const reset = noResults.querySelector("button");
  const url = new URL(location.href);
  let group = url.searchParams.get("group") || "All";
  if (!buttons.some(function (button) { return button.dataset.filter === group; })) group = "All";
  input.value = url.searchParams.get("q") || "";
  tools.hidden = false;

  function normalize(value) {
    return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ").trim();
  }

  function update(updateURL) {
    const terms = normalize(input.value).split(/\s+/).filter(Boolean);
    let matched = 0;
    cards.forEach(function (card) {
      const text = normalize(card.dataset.search);
      const visible = (group === "All" || card.dataset.group === group) &&
        terms.every(function (term) { return text.includes(term); });
      card.hidden = !visible;
      if (visible) matched++;
    });
    buttons.forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.filter === group));
    });
    counter.textContent = matched + (matched === 1 ? " product" : " products");
    noResults.hidden = matched !== 0;
    if (updateURL && (location.protocol === "https:" || location.protocol === "http:")) {
      const current = new URL(location.href);
      if (input.value.trim()) current.searchParams.set("q", input.value.trim());
      else current.searchParams.delete("q");
      if (group === "All") current.searchParams.delete("group");
      else current.searchParams.set("group", group);
      history.replaceState(null, "", current);
    }
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      group = button.dataset.filter;
      update(true);
    });
  });
  input.addEventListener("input", function () { update(true); });
  reset.addEventListener("click", function () {
    group = "All";
    input.value = "";
    update(true);
    input.focus();
  });
  update(false);
  if (location.hash === "#find") input.focus({preventScroll: true});
})();
