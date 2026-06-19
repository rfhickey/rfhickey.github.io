/* Robert Hickey - personal site
   Tiny, dependency-free progressive enhancement:
   1. Theme toggle (light/dark) with localStorage persistence.
   2. Current year in the footer.
   The page is fully functional with JavaScript disabled. */

(function () {
  "use strict";

  var STORAGE_KEY = "rh-theme";
  var root = document.documentElement;

  // Apply a saved preference on load (set as early as possible to avoid flash).
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      root.setAttribute("data-theme", saved);
    }
  } catch (e) { /* localStorage unavailable, fall back to system theme */ }

  function currentTheme() {
    var attr = root.getAttribute("data-theme");
    if (attr) return attr;
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark" : "light";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.getElementById("theme-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var next = currentTheme() === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
      });
    }

    var yearEl = document.getElementById("year");
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  });
})();
