/* Robert Hickey - personal site (neon edition)
   Progressive enhancement only: with this file missing, the page is still a
   complete, readable resume. Every feature initializes inside its own
   try/catch so one failure cannot take down the rest.
   Features: recruiter mode, parallax neon data artwork, scroll reveals,
   pointer glow, metric count-ups, skill cross-filter, a whitelisted mini-SQL
   console (press /), and ?q= / ?skill= deep links. */

(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function reducedMotion() { return motionQuery.matches; }
  function plainMode() { return root.getAttribute("data-theme") === "plain"; }
  function effectsOn() { return !reducedMotion() && !plainMode(); }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ------------------------------------------------------- basic chrome */
  function initChrome() {
    var y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());
    $$("[data-print]").forEach(function (b) {
      b.addEventListener("click", function () { window.print(); });
    });
  }

  /* ---------------------------------------------------- recruiter mode */
  function initMode(onChange) {
    var btn = $("#mode-toggle");
    if (!btn) return;
    function sync() {
      btn.setAttribute("aria-pressed", plainMode() ? "true" : "false");
      var tc = $('meta[name="theme-color"]');
      if (tc) tc.setAttribute("content", plainMode() ? "#f7f8f7" : "#030805");
    }
    sync();
    btn.addEventListener("click", function () {
      if (plainMode()) root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", "plain");
      try { localStorage.setItem("rh-mode", plainMode() ? "plain" : ""); } catch (e) {}
      sync();
      onChange();
    });
  }

  /* --------------------------------------------- parallax data artwork */
  function initScene() {
    var scene = $("#scene");
    if (!scene) return null;
    var layers = $$(".layer", scene);
    if (!layers.length) return null;
    var pending = null;

    function paint() {
      pending = null;
      if (!effectsOn()) return;
      var doc = document.documentElement;
      var max = Math.max(1, doc.scrollHeight - window.innerHeight);
      var progress = Math.min(1, Math.max(0, (window.scrollY || doc.scrollTop || 0) / max));
      var vh = window.innerHeight;
      layers.forEach(function (l) {
        var at = parseFloat(l.getAttribute("data-at")) || 0;
        var travel = parseFloat(l.getAttribute("data-travel")) || 1.5;
        var ty = (at - progress) * travel * vh;
        l.style.transform = "translate3d(0," + ty.toFixed(1) + "px,0)";
      });
    }
    function schedule() {
      if (pending === null) pending = requestAnimationFrame(paint);
    }
    function refresh() {
      if (!effectsOn()) {
        /* rest at the static CSS positions (reduced motion / recruiter mode) */
        layers.forEach(function (l) { l.style.transform = ""; });
        return;
      }
      schedule();
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    refresh();
    return { refresh: refresh };
  }

  /* ------------------------------------------ auto-updating years */
  function initYears() {
    var now = new Date().getFullYear();
    $$("[data-since]").forEach(function (el) {
      var since = parseInt(el.getAttribute("data-since"), 10);
      if (!isFinite(since)) return;
      var baked = parseInt(el.textContent.replace(/[^0-9]/g, ""), 10);
      var years = Math.max(isFinite(baked) ? baked : 0, now - since);
      el.textContent = String(years);
      /* keep the count-up animation ending on the fresh number */
      if (el.hasAttribute("data-target")) el.setAttribute("data-target", String(years));
    });
  }

  /* ------------------------------------------------- scroll reveals */
  function initReveal() {
    var els = $$(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------- pointer glow */
  function initSpot() {
    var spot = $("#spot");
    if (!spot || !window.matchMedia("(pointer: fine)").matches) return;
    var raf = null;
    var x = 0, y = 0;
    function paint() {
      raf = null;
      spot.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    }
    document.addEventListener("pointermove", function (e) {
      if (!effectsOn()) { spot.style.opacity = "0"; return; }
      spot.style.opacity = "1";
      x = e.clientX;
      y = e.clientY;
      if (raf === null) raf = requestAnimationFrame(paint);
    });
    document.addEventListener("pointerleave", function () { spot.style.opacity = "0"; });
  }

  /* -------------------------------------------------- metric count-ups */
  function initStats() {
    var band = $("#stats");
    if (!band || !("IntersectionObserver" in window)) return;
    var nums = $$(".num", band);
    if (!nums.length) return;
    var played = false;
    var io = new IntersectionObserver(function (entries) {
      if (played || !entries[0].isIntersecting) return;
      played = true;
      io.disconnect();
      if (!effectsOn()) return; /* final values are already in the HTML */
      nums.forEach(function (el) {
        var target = parseInt(el.getAttribute("data-target"), 10);
        if (!isFinite(target)) return;
        var t0 = null;
        function tick(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / 700);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString("en-US");
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.35 });
    io.observe(band);
  }

  /* ------------------------------------------------ skill cross-filter */
  function initFilter() {
    var status = $("#filter-status");
    var bar = $("#filter-bar");
    var label = $("#filter-label");
    var copyBtn = $("#copy-link");
    var clearBtn = $("#clear-filter");
    var buttons = $$(".skill-btn");
    var bullets = $$("#experience .role > ul > li");
    var active = null;

    function tokensOf(el) { return (el.getAttribute("data-skills") || "").split(","); }

    function apply(token) {
      reset();
      active = token;
      var hits = 0;
      var roles = {};
      bullets.forEach(function (li) {
        var hit = tokensOf(li).indexOf(token) !== -1;
        li.classList.toggle("match", hit);
        li.classList.toggle("dim", !hit);
        if (hit) {
          hits++;
          var article = li.closest("article.role");
          if (article) roles[article.id] = true;
        }
      });
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-skill") === token ? "true" : "false");
      });
      var roleCount = Object.keys(roles).length;
      var msg = token + ": highlighted in " + roleCount + " role" + (roleCount === 1 ? "" : "s") +
        ", " + hits + " bullet" + (hits === 1 ? "" : "s");
      if (status) status.textContent = msg;
      if (label) label.textContent = "filter: " + msg;
      if (bar) bar.hidden = false;
    }
    function reset() {
      active = null;
      bullets.forEach(function (li) { li.classList.remove("match", "dim"); });
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      if (bar) bar.hidden = true;
    }
    function clear() {
      reset();
      if (status) status.textContent = "filter cleared";
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var token = b.getAttribute("data-skill");
        if (active === token) clear();
        else apply(token);
      });
    });
    if (clearBtn) clearBtn.addEventListener("click", clear);
    if (copyBtn) copyBtn.addEventListener("click", function () {
      if (!active) return;
      var url = location.origin + location.pathname + "?skill=" + encodeURIComponent(active);
      copyText(url, copyBtn);
    });
    return { apply: apply, clear: clear, isActive: function () { return active !== null; } };
  }

  function copyText(text, btn) {
    function flash() {
      if (!btn) return;
      var old = btn.textContent;
      btn.textContent = "copied";
      setTimeout(function () { btn.textContent = old; }, 1200);
    }
    function fallback() { window.prompt("Copy this link:", text); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(flash, fallback);
    } else {
      fallback();
    }
  }

  /* ------------------------------------------------------ mini console */
  var SEL = /^select\s+(\*|[\w\s,]+?)\s+from\s+(experience|skills|education)(?:\s+where\s+(\w+)\s+like\s+'([^']*)')?(?:\s+order\s+by\s+(\w+)(?:\s+(asc|desc))?)?(?:\s+limit\s+(\d+))?$/i;

  function initConsole() {
    var dock = $("#console");
    var out = $("#console-out");
    var input = $("#console-in");
    var openBtn = $("#console-open");
    var closeBtn = $("#console-close");
    if (!dock || !out || !input) return null;

    var DB = {
      experience: [
        { role: "Senior Data Analyst (Lead)", company: "Macabacus", start_date: "2026-09", end_date: "present", location: "Salt Lake City, UT", highlight: "AI-ready analytics foundation: semantic layer, Azure SQL warehouse, Azure DevOps pipelines" },
        { role: "Senior Data Analyst", company: "Big Cartel", start_date: "2024-09", end_date: "2026-09", location: "Salt Lake City, UT", highlight: "AI analysis of 33,000+ conversations at 66% lower query cost" },
        { role: "Product Analyst", company: "MX Technologies", start_date: "2024-06", end_date: "2024-09", location: "Lehi, UT", highlight: "Product Metrics Catalog and self-service Domo dashboards" },
        { role: "Data Analyst", company: "MX Technologies", start_date: "2022-05", end_date: "2024-06", location: "Lehi, UT", highlight: "merchant tagging across billions of transactions in BigQuery" },
        { role: "Data Analyst", company: "Western Governors University", start_date: "2020-08", end_date: "2022-05", location: "Salt Lake City, UT", highlight: "9 Power BI dashboards, promoted from associate in 6 months" },
        { role: "Associate Data Analyst", company: "Western Governors University", start_date: "2020-03", end_date: "2020-08", location: "Salt Lake City, UT", highlight: "Power BI dashboards with row-level security" },
        { role: "Assessment Editor", company: "Western Governors University", start_date: "2015-08", end_date: "2020-02", location: "Salt Lake City, UT", highlight: "psychometric copyediting, coauthored ADA alt-text style guide" },
        { role: "Academic Editor", company: "Crimson Interactive", start_date: "2015-04", end_date: "2019-02", location: "remote", highlight: "economics manuscripts for peer-reviewed journals" },
        { role: "Consultant", company: "Self-employed", start_date: "2010-12", end_date: "2018-08", location: "global", highlight: "science writing and editing, including for the New Scientist" },
        { role: "Blogger", company: "SIMPOL, The Simultaneous Policy", start_date: "2011-01", end_date: "2014-04", location: "remote", highlight: "essays on global governance" },
        { role: "Project Officer", company: "Applied Research and Communications Fund", start_date: "2009-02", end_date: "2015-06", location: "Bulgaria", highlight: "policy research, reports, and proposals" },
        { role: "English Teacher", company: "Eurostar and Educational Technologies high schools", start_date: "2007-12", end_date: "2009-05", location: "Bulgaria", highlight: "exam prep: KET, PET, FCE, TOEFL, IELTS" },
        { role: "Consumer Assistance Program Associate", company: "Vermont Attorney General's Office", start_date: "2004-01", end_date: "2004-05", location: "Burlington, VT", highlight: "consumer complaint intake and resolution" }
      ],
      skills: [
        { column: "sql", type: "language", years: Math.max(8, new Date().getFullYear() - 2018) + "+", seen_in: "all roles" },
        { column: "python", type: "language", years: Math.max(4, new Date().getFullYear() - 2022) + "+", seen_in: "Big Cartel" },
        { column: "regular_expressions", type: "language", years: "", seen_in: "MX" },
        { column: "snowflake", type: "warehouse", years: "", seen_in: "Big Cartel" },
        { column: "bigquery", type: "warehouse", years: "", seen_in: "MX, Big Cartel" },
        { column: "postgresql", type: "warehouse", years: "", seen_in: "earlier roles" },
        { column: "vertica", type: "warehouse", years: "", seen_in: "earlier roles" },
        { column: "azure_sql", type: "warehouse", years: "", seen_in: "Macabacus" },
        { column: "gcp", type: "platform", years: "", seen_in: "Big Cartel" },
        { column: "databricks", type: "platform", years: "", seen_in: "WGU" },
        { column: "dbt", type: "transformation", years: "", seen_in: "Big Cartel" },
        { column: "power_bi", type: "bi", years: "", seen_in: "WGU" },
        { column: "tableau", type: "bi", years: "", seen_in: "MX, Big Cartel" },
        { column: "domo", type: "bi", years: "", seen_in: "MX" },
        { column: "excel", type: "bi", years: "", seen_in: "all roles" },
        { column: "git", type: "tooling", years: "", seen_in: "MX, Big Cartel" },
        { column: "gitlab", type: "tooling", years: "", seen_in: "MX" },
        { column: "vs_code", type: "tooling", years: "", seen_in: "MX, Big Cartel" },
        { column: "claude_code", type: "tooling", years: "", seen_in: "Big Cartel" },
        { column: "azure_devops", type: "tooling", years: "", seen_in: "Macabacus" },
        { column: "dbeaver", type: "tooling", years: "", seen_in: "MX, Big Cartel" }
      ],
      education: [
        { degree: "PhD, Energy Economics", institution: "International Business School, Bulgaria" },
        { degree: "MA, Public Policy and Governance", institution: "New Bulgarian University" },
        { degree: "BA, European History and Political Science", institution: "University of Vermont" },
        { degree: "Data Analyst Learning Path", institution: "Google Cloud Skills Boost" },
        { degree: "Data Analyst Nanodegree", institution: "Udacity" }
      ]
    };

    var HELP = [
      "available commands:",
      "  help                     this text",
      "  ls                       list tables",
      "  whoami                   who is this",
      "  contact                  how to reach Robert",
      "  clear                    clear the screen",
      "  select * from <table>    query the resume",
      "    where <col> like '%x%' | order by <col> [desc] | limit <n>",
      "  example: select * from experience where company like '%cartel%'",
      "  sudo hire robert         escalate privileges"
    ];

    var opener = null;
    var history = [];
    var hIdx = 0;

    function print(text, cls) {
      var div = document.createElement("div");
      if (cls) div.className = cls;
      div.textContent = text;
      out.appendChild(div);
      out.scrollTop = out.scrollHeight;
    }
    function printLink(text, href) {
      var div = document.createElement("div");
      div.className = "c-dim";
      var a = document.createElement("a");
      a.href = href;
      a.textContent = text;
      if (href.indexOf("http") === 0) { a.target = "_blank"; a.rel = "noopener"; }
      div.appendChild(a);
      out.appendChild(div);
      out.scrollTop = out.scrollHeight;
    }
    function printTable(rows, cols) {
      var tbl = document.createElement("table");
      var thead = document.createElement("thead");
      var hr = document.createElement("tr");
      cols.forEach(function (c) {
        var th = document.createElement("th");
        th.textContent = c;
        hr.appendChild(th);
      });
      thead.appendChild(hr);
      tbl.appendChild(thead);
      var tbody = document.createElement("tbody");
      rows.forEach(function (r) {
        var tr = document.createElement("tr");
        cols.forEach(function (c) {
          var td = document.createElement("td");
          td.textContent = String(r[c]);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody);
      out.appendChild(tbl);
      out.scrollTop = out.scrollHeight;
    }

    function runSelect(m) {
      var table = m[2].toLowerCase();
      var rows = DB[table].slice();
      var allCols = Object.keys(rows[0] || {});
      var cols = allCols;
      if (m[1].trim() !== "*") {
        cols = m[1].split(",").map(function (c) { return c.trim().toLowerCase(); });
        for (var i = 0; i < cols.length; i++) {
          if (allCols.indexOf(cols[i]) === -1) {
            print("ERROR: column \"" + cols[i] + "\" does not exist in " + table +
              " (columns: " + allCols.join(", ") + ")", "c-err");
            return false;
          }
        }
      }
      if (m[3]) {
        var wc = m[3].toLowerCase();
        if (allCols.indexOf(wc) === -1) {
          print("ERROR: column \"" + wc + "\" does not exist in " + table, "c-err");
          return false;
        }
        var needle = m[4].replace(/%/g, "").toLowerCase();
        rows = rows.filter(function (r) { return String(r[wc]).toLowerCase().indexOf(needle) !== -1; });
      }
      if (m[5]) {
        var oc = m[5].toLowerCase();
        if (allCols.indexOf(oc) === -1) {
          print("ERROR: column \"" + oc + "\" does not exist in " + table, "c-err");
          return false;
        }
        var dir = (m[6] || "asc").toLowerCase() === "desc" ? -1 : 1;
        rows.sort(function (a, b) { return String(a[oc]).localeCompare(String(b[oc])) * dir; });
      }
      if (m[7]) rows = rows.slice(0, parseInt(m[7], 10));
      if (!rows.length) { print("(0 rows)", "c-dim"); return true; }
      printTable(rows, cols);
      print("(" + rows.length + " row" + (rows.length === 1 ? "" : "s") + ")", "c-dim");
      return true;
    }

    function exec(raw, echo) {
      var cmd = String(raw).trim();
      if (!cmd) return;
      if (echo !== false) print("$ " + cmd, "c-in");
      var bare = cmd.replace(/;\s*$/, "").trim();
      var lower = bare.toLowerCase();
      if (lower === "help") { HELP.forEach(function (l) { print(l, "c-dim"); }); return; }
      if (lower === "clear") { out.textContent = ""; return; }
      if (lower === "ls") { print("experience  skills  education"); return; }
      if (lower === "whoami") {
        print("Robert Hickey. Senior Data Analyst: analytics engineering, AI-assisted development. Sandy, UT.");
        return;
      }
      if (lower === "contact") {
        printLink("rfhickey@gmail.com", "mailto:rfhickey@gmail.com");
        printLink("linkedin.com/in/hickeyrobert", "https://www.linkedin.com/in/hickeyrobert/");
        printLink("github.com/rfhickey", "https://github.com/rfhickey");
        return;
      }
      if (lower === "sudo hire robert") {
        print("QUERY PLAN");
        print("Seq Scan on candidates (cost=0.00..0.42 rows=1)");
        print("  Filter: (name = 'Robert Hickey' AND available = true)");
        print("  Rows Removed by Filter: everyone else");
        print("1 row returned. Recommendation: proceed to offer.", "c-dim");
        printLink("$ open mailto:rfhickey@gmail.com", "mailto:rfhickey@gmail.com");
        return;
      }
      var m = bare.match(SEL);
      if (m) {
        if (runSelect(m)) {
          var share = location.origin + location.pathname + "?q=" + encodeURIComponent(bare);
          printLink("share this query: " + share, share);
        }
        return;
      }
      print("command not found: " + cmd.split(/\s/)[0] + " (try help)", "c-err");
    }

    function open(from) {
      opener = from && typeof from.focus === "function" ? from : openBtn;
      dock.hidden = false;
      if (!out.childNodes.length) {
        print("Robert Hickey resume console. Type help for commands.", "c-dim");
      }
      input.focus();
    }
    function close() {
      dock.hidden = true;
      if (opener && typeof opener.focus === "function" && document.contains(opener)) opener.focus();
    }
    function isOpen() { return !dock.hidden; }

    /* deep-link entry point: run only if the input is on the whitelist */
    function tryRun(raw) {
      var cmd = String(raw || "").trim();
      if (!cmd) return null;
      var bare = cmd.replace(/;\s*$/, "").trim();
      var simple = ["help", "ls", "whoami", "contact", "sudo hire robert"];
      var m = bare.match(SEL);
      if (simple.indexOf(bare.toLowerCase()) === -1 && !m) return null;
      open(null);
      exec(cmd);
      return m ? m[2].toLowerCase() : "";
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var v = input.value;
        if (v.trim()) { history.push(v); hIdx = history.length; }
        input.value = "";
        exec(v);
      } else if (e.key === "ArrowUp") {
        if (history.length) {
          hIdx = Math.max(0, hIdx - 1);
          input.value = history[hIdx];
          e.preventDefault();
        }
      } else if (e.key === "ArrowDown") {
        if (history.length && hIdx < history.length) {
          hIdx = Math.min(history.length, hIdx + 1);
          input.value = hIdx === history.length ? "" : history[hIdx];
          e.preventDefault();
        }
      }
    });
    if (openBtn) openBtn.addEventListener("click", function () {
      if (isOpen()) close(); else open(openBtn);
    });
    if (closeBtn) closeBtn.addEventListener("click", close);

    return { open: open, close: close, isOpen: isOpen, tryRun: tryRun };
  }

  /* ------------------------------------------------- global keyboard */
  function initKeys(consoleApi, filterApi) {
    document.addEventListener("keydown", function (e) {
      var tag = (e.target && e.target.tagName || "").toLowerCase();
      var typing = tag === "input" || tag === "textarea" || tag === "select" ||
        (e.target && e.target.isContentEditable);
      if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        consoleApi.open(document.activeElement);
      } else if (e.key === "Escape") {
        if (consoleApi.isOpen()) consoleApi.close();
        else if (filterApi.isActive()) filterApi.clear();
      }
    });
  }

  /* -------------------------------------- ?q= and ?skill= deep links */
  function initRouter(consoleApi, filterApi) {
    if (!("URLSearchParams" in window)) return;
    var params = new URLSearchParams(location.search);
    var skill = params.get("skill");
    if (skill && /^[a-z0-9-]+$/i.test(skill)) {
      var btn = $('.skill-btn[data-skill="' + skill + '"]');
      if (btn) {
        filterApi.apply(skill);
        /* land on the first highlighted bullet, not the section top: the
           newest role may have nothing highlighted for the chosen skill */
        var first = $("#experience li.match");
        var exp = $("#experience");
        if (first) first.scrollIntoView({ block: "center" });
        else if (exp) exp.scrollIntoView();
        return;
      }
    }
    var q = params.get("q");
    if (q) {
      var table = consoleApi.tryRun(q);
      if (table) {
        var target = { experience: "#experience", skills: "#skills", education: "#education" }[table];
        if (target && $(target)) $(target).scrollIntoView();
      }
    }
  }

  /* ---------------------------------------------------------- wiring */
  var noop = function () {};
  var scene = { refresh: noop };
  var filterApi = { apply: noop, clear: noop, isActive: function () { return false; } };
  var consoleApi = { open: noop, close: noop, isOpen: function () { return false; }, tryRun: function () { return null; } };

  var inits = [
    initChrome,
    initYears,
    function () { initMode(function () { scene.refresh(); }); },
    function () { scene = initScene() || scene; },
    initReveal,
    initSpot,
    initStats,
    function () { filterApi = initFilter() || filterApi; },
    function () { consoleApi = initConsole() || consoleApi; },
    function () { initKeys(consoleApi, filterApi); },
    function () { initRouter(consoleApi, filterApi); }
  ];
  inits.forEach(function (init) {
    try { init(); } catch (e) { /* one broken feature must not break the rest */ }
  });

  var onMotionChange = function () { try { scene.refresh(); } catch (e) {} };
  if (typeof motionQuery.addEventListener === "function") motionQuery.addEventListener("change", onMotionChange);
  else if (typeof motionQuery.addListener === "function") motionQuery.addListener(onMotionChange);
})();
