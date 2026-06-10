(function () {
  "use strict";

  const page = document.body.dataset.page || "home";
  const main = document.querySelector("#main-content");
  const dataCache = new Map();
  const basePath = new URL(document.baseURI).pathname.replace(/\/$/, "");
  const currentPath = location.pathname.startsWith(basePath)
    ? location.pathname.slice(basePath.length) || "/"
    : location.pathname;

  const FALLBACK_SITE = {
    siteName: "Teaching with AI",
    fullName: "Teaching with Artificial Intelligence",
    tagline: "Grounded Curiosity. Defensible Choices. Portfolio Outcomes.",
    contactEmail: "jgarcia@callutheran.edu",
    supportUrl: "",
    newsletterName: "Weekly AI & Teaching Update",
    siteUrl: "",
    goatcounterCode: "",
    lastReviewed: "",
    courseVideos: { opening: [], conclusion: null }
  };
  let site = FALLBACK_SITE;

  const navItems = [
    ["Home", "./", "/"],
    ["Course", "course/", "/course/"],
    ["Key Terms", "key-terms/", "/key-terms/"],
    ["Articles", "articles/", "/articles/"],
    ["Chatbots", "chatbots/", "/chatbots/"],
    ["About", "about/", "/about/"]
  ];

  /* ---------- data + utility helpers ---------- */

  function fetchData(name) {
    if (!dataCache.has(name)) {
      dataCache.set(
        name,
        fetch(`data/${name}.json`).then((response) => {
          if (!response.ok) throw new Error(`Could not load ${name}.json`);
          return response.json();
        })
      );
    }
    return dataCache.get(name);
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function realUrl(url) {
    if (!url) return null;
    const text = String(url).trim();
    if (!text || text.toUpperCase().includes("PLACEHOLDER") || text === "#") return null;
    return text;
  }

  function parseMinutes(text) {
    const value = parseFloat(String(text));
    return Number.isFinite(value) ? value : 0;
  }

  function fmtClock(minutes) {
    const totalSeconds = Math.round(minutes * 60);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function fmtMinutes(minutes) {
    return `${Math.round(minutes)} min`;
  }

  function videoDuration(video) {
    return fmtClock(parseMinutes(video.duration));
  }

  function totalRuntimeMinutes(modules) {
    let total = 0;
    modules.forEach((module) => module.videos.forEach((video) => { total += parseMinutes(video.duration); }));
    ((site.courseVideos && site.courseVideos.opening) || []).forEach((video) => { total += parseMinutes(video.duration); });
    if (site.courseVideos && site.courseVideos.conclusion) total += parseMinutes(site.courseVideos.conclusion.duration);
    return total;
  }

  function runtimeTokens(modules) {
    const total = Math.round(totalRuntimeMinutes(modules));
    const hours = Math.round(total / 60);
    return {
      "{{TOTAL_MINUTES}}": `${total} min`,
      "{{TOTAL_HOURS}}": `about ${hours} hours`,
      "{{TOTAL_RUNTIME}}": `about ${hours} hours (${total} minutes)`
    };
  }

  function replaceTokens(text, tokens) {
    return Object.entries(tokens).reduce((acc, [token, value]) => acc.split(token).join(value), String(text ?? ""));
  }

  function isCurrent(matchPath) {
    if (matchPath === "/") return currentPath === "/";
    return currentPath.startsWith(matchPath);
  }

  /* ---------- glossary term references (tooltips) ---------- */

  function buildTermIndex(terms) {
    const index = [];
    terms.forEach((term) => {
      const names = [term.term, ...(term.aliases || [])];
      names.forEach((name) => index.push({ name, slug: term.slug, definition: term.definition }));
    });
    index.sort((a, b) => b.name.length - a.name.length);
    return index;
  }

  function withTermRefs(text, termIndex) {
    let output = esc(text);
    if (!termIndex || !termIndex.length) return output;
    const linked = new Set();
    termIndex.forEach(({ name, slug, definition }) => {
      if (linked.has(slug)) return;
      const escapedName = esc(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(^|[^A-Za-z0-9_-])(${escapedName})(?=$|[^A-Za-z0-9_-])`);
      if (!pattern.test(output)) return;
      linked.add(slug);
      output = output.replace(
        pattern,
        `$1<a class="term-ref" href="key-terms/#${slug}" data-tip="${esc(definition)}">$2</a>`
      );
    });
    return output;
  }

  /* ---------- shared shell ---------- */

  function injectShell() {
    const header = document.querySelector("#site-header");
    const footer = document.querySelector("#site-footer");
    const email = site.contactEmail || FALLBACK_SITE.contactEmail;
    const subject = encodeURIComponent(`Question about ${document.title || site.siteName}`);
    const supportLink = realUrl(site.supportUrl);

    header.innerHTML = `
      <a class="skip-link" href="#main-content">Skip to content</a>
      <div class="site-header">
        <div class="container header-inner">
          <a class="wordmark" href="./">
            <strong>${esc(site.siteName)}</strong>
            <span>Cal Lutheran Faculty Development</span>
          </a>
          <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open navigation">Menu</button>
          <nav class="site-nav" id="site-nav" aria-label="Primary navigation">
            ${navItems.map(([label, path, matchPath]) => `<a href="${path}" ${isCurrent(matchPath) ? 'aria-current="page"' : ""}>${label}</a>`).join("")}
            <div class="mobile-nav-actions">
              <a class="button button-gold button-small" href="subscribe/">Subscribe</a>
              <a class="button button-light button-small" href="support/">Support</a>
            </div>
          </nav>
          <div class="header-actions">
            <a class="button button-gold button-small" href="subscribe/">Subscribe</a>
            <a class="button button-light button-small" href="support/">Support</a>
          </div>
        </div>
      </div>`;

    footer.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <p class="eyebrow" style="color: var(--gold)">Weekly update</p>
              <h2>Stay thoughtful, not breathless.</h2>
              <p>Receive a short weekly digest of useful developments in AI and teaching.</p>
              <form class="footer-form" name="weekly-updates" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="thanks.html">
                <input type="hidden" name="form-name" value="weekly-updates">
                <p hidden><input name="bot-field"></p>
                <label class="small" for="footer-email">Email address</label>
                <input id="footer-email" type="email" name="email" required placeholder="you@example.edu" autocomplete="email">
                <button class="button button-gold button-small" type="submit">Subscribe</button>
              </form>
            </div>
            <div>
              <h3>Explore</h3>
              <nav class="footer-links" aria-label="Footer navigation">
                <a href="course/">Course</a>
                <a href="start/">Quick Start</a>
                <a href="portfolio/">Portfolio</a>
                <a href="faq/">FAQ</a>
                <a href="updates/">Updates</a>
                <a href="support/">Support</a>
              </nav>
            </div>
            <div>
              <h3>About this resource</h3>
              <p>This is an independent faculty development resource built around grounded curiosity and defensible learning-design choices.</p>
              <p class="small">Course progress is stored only in this browser. The subscribe form collects only what you submit. Do not enter student data into faculty-support chatbots.</p>
              <div class="button-row">
                <a class="button button-light button-small" href="mailto:${esc(email)}?subject=${subject}">Email John</a>
                ${supportLink ? `<a class="button button-gold button-small" href="${esc(supportLink)}" target="_blank" rel="noopener noreferrer">Buy John a coffee</a>` : ""}
              </div>
            </div>
          </div>
          <div class="footer-bottom">
            <span>&copy; <span data-current-year></span> ${esc(site.siteName)}</span>
            <span>${site.lastReviewed ? `Last reviewed ${esc(site.lastReviewed)}` : ""}</span>
          </div>
        </div>
      </footer>
      <a class="ask-john" href="mailto:${esc(email)}?subject=${subject}">Stuck? Ask John</a>
      <div class="toast" role="status" aria-live="polite"></div>`;

    document.querySelector("[data-current-year]").textContent = new Date().getFullYear();

    document.querySelector(".skip-link").addEventListener("click", (event) => {
      event.preventDefault();
      main.focus();
      main.scrollIntoView({ block: "start" });
    });

    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".site-nav");
    const closeMenu = () => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Menu";
      nav.classList.remove("is-open");
      document.body.classList.remove("menu-open");
    };
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      if (expanded) {
        closeMenu();
      } else {
        toggle.setAttribute("aria-expanded", "true");
        toggle.textContent = "Close";
        nav.classList.add("is-open");
        document.body.classList.add("menu-open");
      }
    });
    nav.addEventListener("click", closeMenu);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && document.body.classList.contains("menu-open")) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  function injectAnalytics() {
    const code = (site.goatcounterCode || "").trim();
    if (!code) return;
    const script = document.createElement("script");
    script.async = true;
    script.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
    script.src = "https://gc.zgo.at/count.js";
    document.head.appendChild(script);
  }

  function injectJsonLd(data) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  function pageUrl(path) {
    const root = realUrl(site.siteUrl);
    return root ? `${root.replace(/\/$/, "")}/${path}` : new URL(path, document.baseURI).href;
  }

  function showToast(message) {
    const toast = document.querySelector(".toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  /* ---------- shared components ---------- */

  function placeholderButton(label, extraClass = "") {
    return `<a class="button ${extraClass}" href="#" data-placeholder>${label}</a>`;
  }

  function actionButton(label, url, extraClass = "") {
    const target = realUrl(url);
    if (!target) return placeholderButton(label, extraClass);
    return `<a class="button ${extraClass}" href="${esc(target)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  }

  function pageHero(eyebrow, title, lede, extra = "") {
    return `
      <section class="page-hero">
        <div class="container">
          <p class="eyebrow">${eyebrow}</p>
          <h1>${title}</h1>
          <p class="lede">${lede}</p>
          ${extra}
        </div>
      </section>`;
  }

  function badge(text, className = "") {
    return `<span class="badge ${className}">${text}</span>`;
  }

  function progressBar(percent) {
    return `<div class="progress-bar" aria-label="${percent}% complete"><span style="--progress:${percent}%"></span></div>`;
  }

  function videoPlaceholder(title, label = "Video coming soon") {
    return `
      <div class="video-placeholder">
        <div class="video-placeholder-content">
          <strong>${esc(label)}</strong>
          <p class="small">${esc(title)} will appear here once the media is connected.</p>
        </div>
      </div>`;
  }

  function videoBlock(item, comingSoonLabel = "Video coming soon", direct = false) {
    const url = realUrl(item.embedUrl || item.videoEmbedUrl);
    const title = item.title || item.term || "Course video";
    if (!url) return videoPlaceholder(title, comingSoonLabel);
    if (direct) {
      return `
      <div class="video-embed is-loaded">
        <iframe src="${esc(url)}" title="${esc(title)}" loading="lazy" scrolling="no" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
      </div>`;
    }
    return `
      <div class="video-embed" data-video-embed data-embed-url="${esc(url)}" data-embed-title="${esc(title)}">
        <button class="play-button" type="button" aria-label="Play video: ${esc(title)}">Play</button>
        <strong>${esc(title)}</strong>
        <p class="small">Click to load the video.</p>
      </div>`;
  }

  function moduleItemIds(module) {
    return [
      ...module.videos.map((video) => video.id),
      ...(module.reading ? [module.reading.id] : []),
      ...module.worksheets.map((worksheet) => worksheet.id)
    ];
  }

  function moduleCard(module) {
    const percent = CourseProgress.percent(moduleItemIds(module));
    return `
      <article class="card module-card">
        <div class="module-number">${module.id}</div>
        <div class="badge-row">${badge(`${fmtMinutes(parseMinutes(module.duration))} video`)} ${badge(`Express ${esc(module.express)}`, "badge-gold")}${module.reading ? ` ${badge(esc(module.reading.minutes))}` : ""}</div>
        <h3>${esc(module.title)}</h3>
        <p class="muted">${esc(module.description)}</p>
        <p class="small"><strong>Portfolio artifact:</strong> ${esc(module.artifact)}</p>
        ${progressBar(percent)}
        <p class="small muted">${percent}% complete in this browser</p>
        <a class="button button-outline button-small" href="course/module.html?m=${module.id}">Open Module ${module.id}</a>
      </article>`;
  }

  function ctaBanner() {
    return `
      <section class="section-sm">
        <div class="container">
          <div class="cta-banner">
            <div>
              <p class="eyebrow" style="color:var(--gold)">Keep the conversation going</p>
              <h2>One useful update. Once a week.</h2>
              <p>Follow new articles, course improvements, and faculty-support tools without chasing every headline.</p>
            </div>
            <div class="button-row">
              <a class="button button-gold" href="subscribe/">Subscribe</a>
              <a class="button button-light" href="support/">Support the project</a>
            </div>
          </div>
        </div>
      </section>`;
  }

  /* ---------- global interactions ---------- */

  function bindGlobalInteractions() {
    document.querySelectorAll("[data-placeholder]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        showToast("This resource isn't connected yet. It will go live as course media is finalized.");
      });
    });

    document.querySelectorAll("[data-video-embed] .play-button").forEach((button) => {
      button.addEventListener("click", () => {
        const panel = button.closest("[data-video-embed]");
        const url = panel.dataset.embedUrl;
        const title = panel.dataset.embedTitle || "Course video";
        panel.classList.add("is-loaded");
        panel.innerHTML = `<iframe src="${esc(url)}" title="${esc(title)}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
      });
    });

    document.querySelectorAll("[data-reset-progress]").forEach((button) => {
      button.addEventListener("click", () => {
        CourseProgress.reset();
        showToast("Progress stored in this browser has been reset.");
        setTimeout(() => location.reload(), 350);
      });
    });
  }

  function handleHashTarget() {
    if (!location.hash) return;
    let target = null;
    try {
      target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    } catch (error) {
      target = null;
    }
    if (!target) return;
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: "start" });
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  }

  function bindProgressCheckboxes(moduleIds = []) {
    document.querySelectorAll("[data-progress-id]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        CourseProgress.setComplete(checkbox.dataset.progressId, checkbox.checked);
        if (moduleIds.length) {
          const percent = CourseProgress.percent(moduleIds);
          const percentLabel = document.querySelector("[data-module-percent]");
          const bar = document.querySelector(".page-hero .progress-bar span");
          if (percentLabel) percentLabel.textContent = percent;
          if (bar) {
            bar.style.setProperty("--progress", `${percent}%`);
            bar.parentElement.setAttribute("aria-label", `${percent}% complete`);
          }
        }
        showToast(checkbox.checked ? "Progress saved in this browser." : "Item marked incomplete.");
      });
    });
  }

  /* ---------- page renderers ---------- */

  async function renderHome() {
    const [modules, articles, chatbots, terms] = await Promise.all([
      fetchData("modules"), fetchData("articles"), fetchData("chatbots"), fetchData("key-terms")
    ]);
    const termIndex = buildTermIndex(terms);
    const hoursNum = Math.round(totalRuntimeMinutes(modules) / 60);
    const state = CourseProgress.read();
    const lastId = state._last;
    const lastModule = modules.find((module) => moduleItemIds(module).includes(lastId));
    const continueContent = lastModule
      ? `<div class="continue-banner"><div><strong>Continue where you left off</strong><p>Return to Module ${lastModule.id}: ${esc(lastModule.shortTitle)}.</p></div><a class="button button-small" href="course/module.html?m=${lastModule.id}">Continue Module ${lastModule.id}</a></div>`
      : `<div class="continue-banner"><div><strong>Your progress stays private.</strong><p>Complete checkboxes as you go. Progress is stored only in this browser.</p></div><a class="button button-small" href="course/">View course</a></div>`;

    main.innerHTML = `
      <section class="hero">
        <div class="container">
          <p class="eyebrow">A ${hoursNum}-hour asynchronous faculty course</p>
          <h1>${esc(site.fullName || "Teaching with Artificial Intelligence")}</h1>
          <p class="lede">${esc(site.tagline)}</p>
          <div class="button-row">
            <a class="button button-gold" href="course/">Start the Course</a>
            <a class="button button-light" href="start/">I only have 20 minutes</a>
          </div>
        </div>
      </section>
      <section class="section-sm"><div class="container">${continueContent}</div></section>
      <section class="section" id="needs">
        <div class="container">
          <div class="section-heading"><div><p class="eyebrow">Start with the problem</p><h2>What do you need right now?</h2><p>You do not need to begin with eight hours or with a tool. Begin with the teaching decision in front of you.</p></div></div>
          <div class="grid grid-4">
            <article class="card"><div class="card-icon">POL</div><h3>I need a syllabus AI policy</h3><p>Build transparent, aligned, equity-aware course language.</p><a class="text-link" href="course/module.html?m=5">Go to Module 5 &rarr;</a></article>
            <article class="card"><div class="card-icon">ASN</div><h3>I need to redesign an assignment</h3><p>Protect essential learning without making work explode.</p><a class="text-link" href="course/module.html?m=4">Go to Module 4 &rarr;</a></article>
            <article class="card"><div class="card-icon">INT</div><h3>I suspect AI misuse</h3><p>Move from detection-led reactions to designed evidence.</p><a class="text-link" href="course/module.html?m=5">Explore integrity design &rarr;</a></article>
            <article class="card"><div class="card-icon">101</div><h3>I want to understand the basics</h3><p>Get a functional, discipline-centered orientation.</p><a class="text-link" href="course/module.html?m=1">Start Module 1 &rarr;</a></article>
          </div>
        </div>
      </section>
      <section class="section-tint section">
        <div class="container">
          <div class="stat-strip">
            <div class="stat"><strong>Asynchronous</strong><span>Work at your own pace</span></div>
            <div class="stat"><strong>${hoursNum} hours</strong><span>Total lecture runtime</span></div>
            <div class="stat"><strong>6 modules</strong><span>Each creates an artifact</span></div>
            <div class="stat"><strong>All disciplines</strong><span>With synthetic course packets</span></div>
            <div class="stat"><strong>1 portfolio</strong><span>Ready for next term</span></div>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <div class="section-heading"><div><p class="eyebrow">The course spine</p><h2>Follow the six-module arc</h2><p>Each module produces the input for the next. Jump in where needed, then return to complete the design story.</p></div><a class="button button-outline" href="course/">See all modules</a></div>
          <div class="progress-arc">
            ${modules.map((module) => `<a class="arc-stop" data-number="${module.id}" href="course/module.html?m=${module.id}"><strong>${esc(module.shortTitle)}</strong><small>${fmtMinutes(parseMinutes(module.duration))} video | ${CourseProgress.percent(moduleItemIds(module))}% complete</small></a>`).join("")}
          </div>
        </div>
      </section>
      <section class="section section-tint">
        <div class="container">
          <div class="section-heading"><div><p class="eyebrow">A different kind of AI course</p><h2>Pedagogy first. Durable by design.</h2></div></div>
          <div class="grid grid-3">
            <article class="card"><div class="card-icon">01</div><h3>Not a tool tour</h3><p>${withTermRefs("Tools change. The course builds judgment around learning, evidence, and disciplinary values.", termIndex)}</p></article>
            <article class="card"><div class="card-icon">02</div><h3>Every module produces something</h3><p>${withTermRefs("Leave with policy, assignment, audit, and implementation documents you can use.", termIndex)}</p></article>
            <article class="card"><div class="card-icon">03</div><h3>Anchored in named frameworks</h3><p>${withTermRefs("AIAS, TILT, Safety Gap, and Oracle/Tutor/Adversary turn intuition into explainable choices.", termIndex)}</p></article>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <div class="section-heading"><div><p class="eyebrow">Curated context</p><h2>Latest AI and teaching articles</h2></div><a class="button button-outline" href="articles/">All articles</a></div>
          <div class="grid grid-3">${articles.slice(0, 3).map(articleCard).join("")}</div>
        </div>
      </section>
      <section class="section-sm">
        <div class="container">
          <div class="callout callout-gold">
            <p class="eyebrow">Faculty-support chatbots</p>
            <h2>Get past the blank chat box.</h2>
            <p class="lede">Each chatbot concept includes starter prompts, a bounded task, and a reminder that faculty judgment remains the point.</p>
            <div class="button-row"><a class="button" href="chatbots/">Browse ${chatbots.length} chatbot concepts</a></div>
          </div>
        </div>
      </section>
      ${ctaBanner()}`;

    injectJsonLd({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.siteName,
      url: pageUrl(""),
      description: site.tagline
    });
  }

  function renderVideoCard(video) {
    const checked = CourseProgress.isComplete(video.id);
    const hasUrl = Boolean(realUrl(video.embedUrl));
    return `
      <article class="video-card" id="video-${video.id}">
        <h3>${esc(video.title)}</h3>
        <div class="module-meta"><span>${videoDuration(video)}</span>${video.express ? badge("Express path", "badge-gold") : ""}${hasUrl ? "" : `<span class="placeholder-note">Coming soon</span>`}</div>
        ${videoBlock(video, "Video coming soon", true)}
        <label class="check-row"><input type="checkbox" data-progress-id="${esc(video.id)}" ${checked ? "checked" : ""}><span><strong>Mark video complete</strong><br><span class="small muted">Stored only in this browser</span></span></label>
        <details><summary>${video.summary ? "Video summary" : `Read transcript${video.transcriptFull ? "" : " preview"}`}</summary><div class="details-body"><p>${esc(video.summary || video.transcriptFull || video.transcript)}</p>${video.summary || video.transcriptFull ? "" : `<p class="small">Full transcript will be loaded from the final content data.</p>`}</div></details>
      </article>`;
  }

  function renderWorksheet(worksheet) {
    const checked = CourseProgress.isComplete(worksheet.id);
    return `
      <article class="resource-card">
        <div class="resource-icon">DOC</div>
        <div>
          <h3>${esc(worksheet.title)}</h3>
          <p class="small muted">${esc(worksheet.minutes)}${realUrl(worksheet.url) ? "" : " | Links coming soon"}</p>
          <label class="check-row"><input type="checkbox" data-progress-id="${esc(worksheet.id)}" ${checked ? "checked" : ""}><span>Mark complete</span></label>
        </div>
        <div class="resource-actions">
          ${actionButton("Make your own copy", worksheet.url, "button-small")}
          ${actionButton("Word/PDF export", worksheet.exportUrl, "button-outline button-small")}
        </div>
      </article>`;
  }

  function renderReading(reading, termIndex) {
    if (!reading) return "";
    const checked = CourseProgress.isComplete(reading.id);
    const hasLink = Boolean(realUrl(reading.url) || realUrl(reading.exportUrl));
    return `
      <article class="reading-card" id="reading-${esc(reading.id)}">
        <div class="reading-icon" aria-hidden="true">READ</div>
        <div>
          <div class="badge-row">${badge(esc(reading.minutes), "badge-gold")} ${badge("Faculty development reading")}${hasLink ? "" : `<span class="placeholder-note">Coming soon</span>`}</div>
          <h3>${esc(reading.title)}</h3>
          <p class="muted">${termIndex ? withTermRefs(reading.description, termIndex) : esc(reading.description)}</p>
          ${reading.version ? `<p class="small muted">${esc(reading.version)}</p>` : ""}
          <label class="check-row"><input type="checkbox" data-progress-id="${esc(reading.id)}" ${checked ? "checked" : ""}><span><strong>Mark reading complete</strong><br><span class="small muted">Stored only in this browser</span></span></label>
        </div>
        <div class="resource-actions">
          ${actionButton("Read online", reading.url, "button-small")}
          ${actionButton("Download (Word/PDF)", reading.exportUrl, "button-outline button-small")}
        </div>
      </article>`;
  }

  async function renderCourse() {
    const modules = await fetchData("modules");
    const tokens = runtimeTokens(modules);
    const opening = (site.courseVideos && site.courseVideos.opening) || [];
    const conclusion = site.courseVideos && site.courseVideos.conclusion;
    main.innerHTML = `
      ${pageHero("Course hub", "Six modules. One teaching-ready portfolio.", "Move from disciplinary values to a redesigned assignment, transparent policy, and a sustainable six-month plan.", `<div class="button-row"><a class="button" href="start/">Choose a quick-start path</a><a class="button button-outline" href="portfolio/">Open portfolio checklist</a></div>`)}
      <section class="section-sm">
        <div class="container">
          <div class="callout">
            <h3>How to take this course</h3>
            <p>${replaceTokens("The complete lecture sequence runs {{TOTAL_RUNTIME}}. Each module pairs its lectures with a faculty development reading (roughly 25&ndash;30 minutes) that synthesizes the module and prepares you for its worksheet. Use one real course as your design substrate. Complete the modules in sequence for the strongest portfolio story, or begin with the problem you need to solve.", tokens)}</p>
            <p class="small muted">Progress is stored only in this browser. <button class="copy-link" type="button" data-reset-progress>Reset my progress</button></p>
          </div>
        </div>
      </section>
      ${opening.length ? `
      <section class="section">
        <div class="container">
          <div class="section-heading"><div><p class="eyebrow">Begin here</p><h2>Course introduction and overview</h2><p>These two short videos orient you to the course before you enter Module 1.</p></div></div>
          <div class="grid grid-2">${opening.map(renderVideoCard).join("")}</div>
        </div>
      </section>` : ""}
      <section class="section">
        <div class="container">
          <div class="section-heading"><div><p class="eyebrow">The full course</p><h2>Build the design story</h2></div></div>
          <div class="grid grid-3">${modules.map(moduleCard).join("")}</div>
        </div>
      </section>
      ${conclusion ? `
      <section class="section section-tint">
        <div class="container">
          <div class="section-heading"><div><p class="eyebrow">Complete the arc</p><h2>Course conclusion</h2><p>Close the course after assembling your portfolio and six-month plan.</p></div></div>
          <div class="narrow">${renderVideoCard(conclusion)}</div>
        </div>
      </section>` : ""}
      ${ctaBanner()}`;

    bindProgressCheckboxes();

    injectJsonLd({
      "@context": "https://schema.org",
      "@type": "Course",
      name: site.fullName || site.siteName,
      description: "A six-module asynchronous faculty development course on teaching with artificial intelligence. Pedagogy-first and portfolio-based: every module produces a usable course-design artifact.",
      provider: { "@type": "CollegeOrUniversity", name: "California Lutheran University", sameAs: "https://www.callutheran.edu" },
      isAccessibleForFree: true,
      timeRequired: `PT${Math.round(totalRuntimeMinutes(modules))}M`,
      hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: `PT${Math.round(totalRuntimeMinutes(modules))}M` }
    });
  }

  async function renderModule() {
    const [modules, terms] = await Promise.all([fetchData("modules"), fetchData("key-terms")]);
    const termIndex = buildTermIndex(terms);
    const moduleId = Number(new URLSearchParams(location.search).get("m"));
    const module = modules.find((item) => item.id === moduleId);
    if (!module) {
      location.replace(new URL("course/", document.baseURI));
      return;
    }

    document.title = `Module ${module.id}: ${module.shortTitle} | ${site.siteName}`;
    const email = site.contactEmail || FALLBACK_SITE.contactEmail;
    const moduleSubject = encodeURIComponent(`Question about Module ${module.id}`);
    document.querySelectorAll(".ask-john, .site-footer a[href^='mailto:']").forEach((link) => {
      link.href = `mailto:${email}?subject=${moduleSubject}`;
    });
    const ids = moduleItemIds(module);
    const percent = CourseProgress.percent(ids);
    const previous = modules.find((item) => item.id === module.id - 1);
    const next = modules.find((item) => item.id === module.id + 1);
    const slides = module.slides || {};
    const hasExpressItems = module.videos.some((video) => video.express);

    main.innerHTML = `
      <section class="page-hero">
        <div class="container">
          <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="course/">Course</a><span>&rsaquo;</span><span>Module ${module.id}</span></nav>
          <div class="badge-row">${badge(`Module ${module.id}`)} ${badge(`${fmtMinutes(parseMinutes(module.duration))} video`)} ${badge(`Express ${esc(module.express)}`, "badge-gold")} ${badge(`Reviewed ${esc(module.lastReviewed)}`)}</div>
          <h1>${esc(module.title)}</h1>
          <p class="lede">${withTermRefs(module.description, termIndex)}</p>
          <div style="max-width:620px">${progressBar(percent)}<p class="small muted"><span data-module-percent>${percent}</span>% complete in this browser</p></div>
        </div>
      </section>
      <section class="section">
        <div class="container content-layout">
          <div class="stack">
            <section>
              <p class="eyebrow">Learning objectives</p>
              <h2>What you will be able to do</h2>
              <div class="card"><ul>${module.objectives.map((objective) => `<li>${withTermRefs(objective, termIndex)}</li>`).join("")}</ul></div>
            </section>
            <section>
              <p class="eyebrow">Time budget</p>
              <div class="callout callout-gold"><h3>${fmtMinutes(parseMinutes(module.duration))} total lecture runtime | ${esc(module.express)} express path${module.reading ? ` | ${esc(module.reading.minutes)}` : ""}</h3><p>The listed runtime reflects the current module lectures.${module.reading ? ` The module reading adds a careful ${esc(module.reading.minutes.replace(" read", ""))}.` : ""} Worksheets and optional portfolio activities add time based on how deeply you choose to engage.${hasExpressItems ? " The express path is the shortest route to this module's artifact &mdash; look for the gold Express badges below." : ""}</p></div>
            </section>
            <section id="videos">
              <p class="eyebrow">Watch and reflect</p>
              <h2>Module videos</h2>
              <div class="stack">${module.videos.map(renderVideoCard).join("")}</div>
            </section>
            ${module.reading ? `
            <section id="reading">
              <p class="eyebrow">Read and connect</p>
              <h2>Module reading</h2>
              <p class="muted">A faculty development reading that synthesizes this module's lectures, adds cross-disciplinary examples, and closes with a checklist for the module artifact. Read it after the videos and before the worksheet.</p>
              ${renderReading(module.reading, termIndex)}
            </section>` : ""}
            <section id="worksheets">
              <p class="eyebrow">Make the work usable</p>
              <h2>Worksheets and resources</h2>
              <p class="muted">Each worksheet offers a one-click Google copy and a Word/PDF export, so you never hit a permissions wall.</p>
              <div class="resource-list">${module.worksheets.map(renderWorksheet).join("")}</div>
            </section>
            <section>
              <p class="eyebrow">Slides</p>
              <div class="resource-card">
                <div class="resource-icon">PDF</div>
                <div><h3>${esc(slides.title || `Module ${module.id} slide deck`)}</h3><p class="small muted">${realUrl(slides.pdfUrl) || realUrl(slides.previewUrl) ? "View in Google Drive or download the PDF." : "Slide links coming soon."}</p></div>
                <div class="resource-actions">
                  ${actionButton("Preview slides", slides.previewUrl, "button-small")}
                  ${actionButton("Open PDF", slides.pdfUrl, "button-outline button-small")}
                </div>
              </div>
            </section>
            <section>
              <p class="eyebrow">Portfolio connection</p>
              <div class="callout"><h2>${withTermRefs(module.artifact, termIndex)}</h2><p>By the end of this module, this artifact should be ready to carry into the next design decision.</p><a class="button button-small" href="portfolio/">Open portfolio checklist</a></div>
            </section>
            <section>
              <p class="eyebrow">Quick feedback</p>
              <div class="form-card">
                <h2>Was this module helpful?</h2>
                <form class="form-grid" name="module-feedback" data-feedback-form>
                  <input type="hidden" name="form-name" value="module-feedback">
                  <input type="hidden" name="module" value="${module.id}">
                  <input type="hidden" name="helpful" value="">
                  <p hidden><input name="bot-field"></p>
                  <div class="feedback-buttons" role="group" aria-label="Was this module helpful?">
                    <button class="button button-outline button-small" type="button" data-helpful="yes" aria-pressed="false">Yes, helpful</button>
                    <button class="button button-outline button-small" type="button" data-helpful="no" aria-pressed="false">Not yet</button>
                  </div>
                  <div class="form-field"><label for="feedback-comment">Optional comment</label><textarea id="feedback-comment" name="comment" placeholder="What should change?"></textarea></div>
                  <button class="button button-small" type="submit">Send feedback</button>
                </form>
              </div>
            </section>
            <nav class="button-row" aria-label="Module navigation">
              ${previous ? `<a class="button button-outline" href="course/module.html?m=${previous.id}">&larr; Module ${previous.id}</a>` : `<a class="button button-outline" href="course/">Course hub</a>`}
              ${next ? `<a class="button" href="course/module.html?m=${next.id}">Module ${next.id} &rarr;</a>` : `<a class="button" href="portfolio/">Complete portfolio &rarr;</a>`}
            </nav>
          </div>
          <aside class="sidebar">
            <div class="card">
              <p class="eyebrow">Related key terms</p>
              <div class="badge-row">${(module.relatedTerms || []).map((slug) => {
                const term = terms.find((item) => item.slug === slug);
                return `<a class="badge" href="key-terms/#${esc(slug)}">${esc(term ? term.term : slug.replaceAll("-", " "))}</a>`;
              }).join("")}</div>
            </div>
            <div class="card">
              <h3>Stuck on Module ${module.id}?</h3>
              <p class="small muted">A human escape hatch matters. Ask a focused question and include the page or item name.</p>
              <a class="button button-small" href="mailto:${esc(email)}?subject=${moduleSubject}">Ask John</a>
            </div>
            <div class="card"><p class="small muted">Progress is stored only in this browser.</p><button class="copy-link" type="button" data-reset-progress>Reset my progress</button></div>
          </aside>
        </div>
      </section>
      ${ctaBanner()}`;

    bindProgressCheckboxes(ids);
    bindFeedbackForm();
  }

  function bindFeedbackForm() {
    const form = document.querySelector("[data-feedback-form]");
    if (!form) return;
    const helpfulInput = form.querySelector("input[name='helpful']");
    form.querySelectorAll("[data-helpful]").forEach((button) => {
      button.addEventListener("click", () => {
        const selected = button.getAttribute("aria-pressed") !== "true";
        form.querySelectorAll("[data-helpful]").forEach((item) => item.setAttribute("aria-pressed", "false"));
        button.setAttribute("aria-pressed", String(selected));
        helpfulInput.value = selected ? button.dataset.helpful : "";
      });
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      if (!data.get("helpful") && !String(data.get("comment") || "").trim()) {
        showToast("Choose yes or no, or add a comment, before sending.");
        return;
      }
      try {
        const response = await fetch(location.pathname, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(data).toString()
        });
        if (!response.ok) throw new Error("Feedback endpoint unavailable");
        form.innerHTML = `<p><strong>Thank you.</strong> Your feedback improves the next revision of this module.</p>`;
        showToast("Feedback sent. Thank you.");
      } catch (error) {
        showToast("Could not send feedback here. Use the Ask John link instead.");
      }
    });
  }

  function termCard(term) {
    return `
      <article class="card term-card" id="${esc(term.slug)}" data-term-module="${term.module}" data-term-letter="${esc(term.term[0].toUpperCase())}" data-term-search="${esc(`${term.term} ${term.definition}`.toLowerCase())}">
        <div class="badge-row">${badge(`Module ${term.module}`)}</div>
        <h3>${esc(term.term)}</h3>
        <p>${esc(term.definition)}</p>
        ${videoBlock(term, "Key-term video coming soon")}
        <details><summary>Read full script</summary><div class="details-body"><p>${esc(term.script)}</p></div></details>
        <button class="copy-link" type="button" data-copy-term="${esc(term.slug)}">Copy link to this term</button>
      </article>`;
  }

  async function renderKeyTerms() {
    const terms = await fetchData("key-terms");
    const letters = [...new Set(terms.map((term) => term.term[0].toUpperCase()))].sort();
    main.innerHTML = `
      ${pageHero("Video glossary", "Key terms without the jargon barrier.", "Search plain-language definitions, filter by module, and load short video explainers only when you want them.")}
      <section class="section">
        <div class="container">
          <label for="term-search"><strong>Search key terms</strong></label>
          <input class="search-field" id="term-search" type="search" placeholder="Try: assessment, equity, safety gap...">
          <div class="filter-bar" aria-label="Filter key terms by module">
            <button class="filter-button" type="button" aria-pressed="true" data-term-filter="all">All</button>
            ${[1, 2, 3, 4, 5, 6].map((number) => `<button class="filter-button" type="button" aria-pressed="false" data-term-filter="${number}">Module ${number}</button>`).join("")}
          </div>
          <nav class="az-bar" aria-label="Jump to terms by first letter">${letters.map((letter) => `<button type="button" class="az-letter" data-az="${letter}">${letter}</button>`).join("")}</nav>
          <div class="grid grid-3" id="term-grid">${terms.map(termCard).join("")}</div>
          <div class="empty-state" id="term-empty" hidden>No terms match that search and module filter.</div>
        </div>
      </section>
      ${ctaBanner()}`;

    const search = document.querySelector("#term-search");
    const cards = [...document.querySelectorAll(".term-card")];
    const empty = document.querySelector("#term-empty");
    let activeFilter = "all";
    const applyFilters = () => {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      cards.forEach((card) => {
        const matchesSearch = card.dataset.termSearch.includes(query);
        const matchesModule = activeFilter === "all" || card.dataset.termModule === activeFilter;
        card.hidden = !(matchesSearch && matchesModule);
        if (!card.hidden) visible += 1;
      });
      empty.hidden = visible !== 0;
    };
    search.addEventListener("input", applyFilters);
    document.querySelectorAll("[data-term-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.termFilter;
        document.querySelectorAll("[data-term-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        applyFilters();
      });
    });
    document.querySelectorAll(".az-letter").forEach((button) => {
      button.addEventListener("click", () => {
        const target = cards.find((card) => !card.hidden && card.dataset.termLetter === button.dataset.az);
        if (!target) {
          showToast("No visible terms under that letter with the current filters.");
          return;
        }
        target.scrollIntoView({ block: "start" });
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    });
    document.querySelectorAll("[data-copy-term]").forEach((button) => {
      button.addEventListener("click", async () => {
        const url = `${location.origin}${location.pathname}#${button.dataset.copyTerm}`;
        try {
          await navigator.clipboard.writeText(url);
          showToast("Term link copied.");
        } catch (error) {
          showToast("Copy is unavailable here. Use the address bar link.");
        }
      });
    });

    injectJsonLd({
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      name: `${site.siteName} — Key Terms`,
      url: pageUrl("key-terms/"),
      hasDefinedTerm: terms.map((term) => ({
        "@type": "DefinedTerm",
        name: term.term,
        description: term.definition,
        url: pageUrl(`key-terms/#${term.slug}`)
      }))
    });
  }

  function articleCard(article) {
    return `
      <article class="card article-card" data-article-tags="${esc(article.tags.join(" "))}">
        <div class="badge-row">${article.tags.map((tag) => badge(esc(tag))).join("")}</div>
        <div class="article-meta"><span>${esc(article.source)}</span><span>${esc(article.date)}</span></div>
        <h3>${esc(article.title)}</h3>
        <p>${esc(article.annotation)}</p>
        ${actionButton("Read article", article.url, "button-outline button-small")}
      </article>`;
  }

  async function renderArticles() {
    const articles = await fetchData("articles");
    let feed = null;
    try {
      feed = await fetchData("feed-cache");
    } catch (error) {
      feed = null;
    }
    const feedItems = (feed && Array.isArray(feed.items) ? feed.items : []).slice(0, 12);
    const tags = [...new Set(articles.flatMap((article) => article.tags))].sort();
    main.innerHTML = `
      ${pageHero("Curated context", "AI and teaching, with a reason to read.", "Each featured article includes a short explanation of why it matters for faculty.")}
      <section class="section">
        <div class="container">
          <div class="filter-bar" aria-label="Filter articles">
            <button class="filter-button" type="button" aria-pressed="true" data-article-filter="all">All</button>
            ${tags.map((tag) => `<button class="filter-button" type="button" aria-pressed="false" data-article-filter="${esc(tag)}">${esc(tag)}</button>`).join("")}
          </div>
          <div class="grid grid-3">${articles.map(articleCard).join("")}</div>
        </div>
      </section>
      ${feedItems.length ? `
      <section class="section section-tint">
        <div class="container">
          <p class="eyebrow">Recent from around the web</p>
          <h2>New from the journals and magazines</h2>
          <p class="small muted">Refreshed daily from configured feeds${feed.updated ? ` | Last updated ${esc(feed.updated)}` : ""}. External links do not imply endorsement.</p>
          <div class="grid grid-3" style="margin-top:1.5rem">
            ${feedItems.map((item) => `
              <article class="card article-card">
                <div class="article-meta"><span>${esc(item.source)}</span><span>${esc(item.date || "")}</span></div>
                <h3>${esc(item.title)}</h3>
                <a class="button button-outline button-small" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Read article</a>
              </article>`).join("")}
          </div>
        </div>
      </section>` : ""}
      ${ctaBanner()}`;

    document.querySelectorAll("[data-article-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.articleFilter;
        document.querySelectorAll("[data-article-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        document.querySelectorAll(".article-card[data-article-tags]").forEach((card) => {
          card.hidden = filter !== "all" && !card.dataset.articleTags.split(" ").includes(filter);
        });
      });
    });
  }

  async function renderChatbots() {
    const chatbots = await fetchData("chatbots");
    main.innerHTML = `
      ${pageHero("Faculty-support tools", "Start with a bounded task, not a blank chat box.", "These chatbot concepts provide starter prompts and realistic expectations. Never paste student PII into a chatbot.")}
      <section class="section-sm"><div class="container"><div class="callout callout-gold"><h3>Privacy first</h3><p>Use de-identified or synthetic material. You remain responsible for the final teaching decision and for reviewing any generated content.</p></div></div></section>
      <section class="section">
        <div class="container">
          <div class="grid grid-2">
            ${chatbots.map((bot) => {
              const live = bot.status === "live" && realUrl(bot.url);
              return `
              <article class="card ${bot.status === "coming-soon" ? "status-coming" : ""}">
                <div class="badge-row">${badge(bot.status === "coming-soon" ? "Coming soon" : "Live", bot.status === "live" ? "badge-success" : "badge-gold")}</div>
                <div class="card-icon">${esc(bot.icon)}</div>
                <h3>${esc(bot.name)}</h3>
                <p>${esc(bot.description)}</p>
                <ul>${bot.capabilities.map((capability) => `<li>${esc(capability)}</li>`).join("")}</ul>
                <h4>Starter prompts</h4>
                <ul class="starter-prompts">${bot.prompts.map((prompt) => `<li>&ldquo;${esc(prompt)}&rdquo;</li>`).join("")}</ul>
                <p class="small muted"><strong>Expectation:</strong> ${esc(bot.expectation)}</p>
                ${live ? actionButton("Click here to use", bot.url, "button-small") : placeholderButton("Coming soon", "button-small")}
              </article>`;
            }).join("")}
          </div>
        </div>
      </section>
      ${ctaBanner()}`;
  }

  async function renderPortfolio() {
    const modules = await fetchData("modules");
    const artifactIds = modules.map((module) => `artifact-${module.id}`);
    main.innerHTML = `
      ${pageHero("Course redesign portfolio", "Six connected artifacts. One usable teaching packet.", "Track the documents you have built, make a copy of the final workbook, and print a completion summary when the packet is ready.", `<div class="button-row">${actionButton("Make a copy of the Portfolio Workbook", site.portfolioWorkbookUrl)}<button class="button button-outline" type="button" onclick="window.print()">Print completion summary</button></div>`)}
      <section class="section-sm">
        <div class="container">
          <div class="callout"><h3>Your portfolio progress</h3>${progressBar(CourseProgress.percent(artifactIds))}<p><strong><span data-portfolio-percent>${CourseProgress.percent(artifactIds)}</span>% complete</strong> | Stored only in this browser</p></div>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <div class="stack">
            ${modules.map((module) => `
              <article class="card portfolio-item">
                <input type="checkbox" aria-label="Mark ${esc(module.artifact)} complete" data-progress-id="artifact-${module.id}" ${CourseProgress.isComplete(`artifact-${module.id}`) ? "checked" : ""}>
                <div><div class="badge-row">${badge(`Module ${module.id}`)}</div><h3>${esc(module.artifact)}</h3><p class="muted">${esc(module.description)}</p></div>
                <a class="button button-outline button-small" href="course/module.html?m=${module.id}">Open Module ${module.id}</a>
              </article>`).join("")}
          </div>
          <div class="completion-state" data-completion-state style="margin-top:2rem"><h2>Portfolio complete</h2><p>Your completion summary is ready to print and share with your chair or faculty-development team.</p><button class="button" type="button" onclick="window.print()">Print summary</button></div>
        </div>
      </section>
      ${ctaBanner()}`;

    const updatePortfolio = () => {
      const percent = CourseProgress.percent(artifactIds);
      document.querySelector("[data-portfolio-percent]").textContent = percent;
      document.querySelector(".callout .progress-bar span").style.setProperty("--progress", `${percent}%`);
      document.querySelector("[data-completion-state]").classList.toggle("is-visible", percent === 100);
    };
    bindProgressCheckboxes();
    document.querySelectorAll("[data-progress-id]").forEach((checkbox) => checkbox.addEventListener("change", updatePortfolio));
    updatePortfolio();
  }

  async function renderStart() {
    const [paths, modules] = await Promise.all([fetchData("quickstart"), fetchData("modules")]);
    const tokens = runtimeTokens(modules);
    main.innerHTML = `
      ${pageHero("Quick start", "Make the time you have count.", "Choose a realistic path, make one defensible change, and return when you have more room.")}
      <section class="section">
        <div class="container">
          <div class="grid grid-2">
            ${paths.map((path) => `
              <article class="card">
                <div class="badge-row">${badge(esc(replaceTokens(path.minutes, tokens)), "badge-gold")}</div>
                <h2>${esc(path.label)}</h2>
                <p>${esc(path.description)}</p>
                <div class="timeline">${path.steps.map((step, index) => `<div class="timeline-item" data-step="${index + 1}"><h3><a href="${esc(step.url)}">${esc(step.title)}</a></h3><p class="small muted">${esc(replaceTokens(step.minutes, tokens))}</p></div>`).join("")}</div>
              </article>`).join("")}
          </div>
        </div>
      </section>
      <section class="section section-tint">
        <div class="container">
          <p class="eyebrow">Quick wins</p><h2>Five things you can do this week</h2>
          <div class="grid grid-3">
            <div class="card"><h3>Add one transparent-expectations line</h3><p>Name what students may use, what they must do, and why.</p></div>
            <div class="card"><h3>Stress-test one assignment</h3><p>Ask where AI could bypass the essential learning.</p></div>
            <div class="card"><h3>Name one disciplinary practice</h3><p>Replace the phrase "critical thinking" with something observable.</p></div>
            <div class="card"><h3>Remove one needless friction point</h3><p>Keep the difficulty that matters; reduce the difficulty that does not.</p></div>
            <div class="card"><h3>Audit one AI requirement</h3><p>Check access, privacy, paid tiers, and non-AI alternatives.</p></div>
          </div>
        </div>
      </section>
      ${ctaBanner()}`;
  }

  async function renderFaq() {
    const [faq, modules] = await Promise.all([fetchData("faq"), fetchData("modules")]);
    const tokens = runtimeTokens(modules);
    const entries = faq.map((item) => ({ question: item.question, answer: replaceTokens(item.answer, tokens) }));
    main.innerHTML = `
      ${pageHero("Faculty FAQ", "Direct answers for real course constraints.", "The course is designed for busy faculty, uneven support, different disciplines, and legitimate skepticism.")}
      <section class="section"><div class="narrow">${entries.map((item) => `<details><summary>${esc(item.question)}</summary><div class="details-body"><p>${esc(item.answer)}</p></div></details>`).join("")}</div></section>
      ${ctaBanner()}`;

    injectJsonLd({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: entries.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer }
      }))
    });
  }

  async function renderUpdates() {
    const updates = await fetchData("updates");
    main.innerHTML = `
      ${pageHero("Weekly update archive", "See what the newsletter delivers.", "Past updates remain linkable and useful after the week they were sent.", `<div class="button-row"><a class="button" href="subscribe/">Subscribe to weekly updates</a></div>`)}
      <section class="section"><div class="narrow stack">${updates.map((update) => `<article class="card"><div class="article-meta"><span>${esc(update.date)}</span></div><h2>${esc(update.headline)}</h2><p>${update.body}</p><div class="button-row">${update.links.map((link) => `<a class="button button-outline button-small" href="${esc(link.url)}">${esc(link.title)}</a>`).join("")}</div></article>`).join("")}</div></section>
      ${ctaBanner()}`;
  }

  function renderSubscribe() {
    main.innerHTML = `
      ${pageHero("Weekly update", "Useful developments, without the headline chase.", "New articles, course improvements, and faculty-support tools in one short weekly email.")}
      <section class="section">
        <div class="narrow">
          <div class="form-card">
            <form class="form-grid" name="weekly-updates" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="thanks.html">
              <input type="hidden" name="form-name" value="weekly-updates">
              <p hidden><input name="bot-field"></p>
              <div class="form-field"><label for="name">Name <span class="muted">(optional)</span></label><input id="name" type="text" name="name" autocomplete="name"></div>
              <div class="form-field"><label for="email">Email address</label><input id="email" type="email" name="email" required autocomplete="email"></div>
              <label class="check-row"><input type="checkbox" name="clu-faculty"><span>I teach at Cal Lutheran</span></label>
              <button class="button" type="submit">Subscribe</button>
            </form>
            <p class="small muted" style="margin-top:1rem">Your email is used only for the weekly update. Unsubscribe anytime.</p>
          </div>
          <p style="margin-top:1.5rem"><a class="text-link" href="updates/">Preview past weekly updates &rarr;</a></p>
        </div>
      </section>`;
  }

  function renderSupport() {
    main.innerHTML = `
      ${pageHero("Support the project", "Help keep practical faculty resources free.", "Support helps cover hosting, video production, and future faculty-support tools.")}
      <section class="section">
        <div class="narrow">
          <div class="callout callout-gold">
            <p class="eyebrow">What support covers</p>
            <h2>Small infrastructure, sustained attention.</h2>
            <ul><li>Website and media hosting</li><li>HeyGen and video production costs</li><li>Chatbot API and maintenance costs</li><li>Annual capability-drift review</li></ul>
            ${actionButton("Buy John a Coffee", site.supportUrl, "button-gold")}
            <p class="small muted" style="margin-top:1rem">Opens Buy Me a Coffee in a new tab.</p>
          </div>
        </div>
      </section>`;
  }

  function renderAbout() {
    main.innerHTML = `
      ${pageHero("About the course", "Grounded curiosity is a design stance.", "This course refuses both AI evangelism and AI panic. It asks faculty to make choices they can explain, defend, and revise.")}
      <section class="section">
        <div class="container grid grid-2">
          <article>
            <p class="eyebrow">Course philosophy</p><h2>Pedagogy before platforms.</h2>
            <p>The course begins with disciplinary values and learning evidence rather than software features. It treats faculty skepticism as a legitimate professional stance and uses structured artifacts to turn that stance into design decisions.</p>
            <p>Named frameworks such as AIAS, TILT, Safety Gap, Oracle/Tutor/Adversary, and capability drift help faculty explain their choices to students and colleagues.</p>
          </article>
          <article class="card">
            <div class="video-placeholder"><div class="video-placeholder-content"><strong>Instructor photo placeholder</strong><p class="small">Add approved portrait or course artwork.</p></div></div>
            <h2 style="margin-top:1.25rem">John Garcia</h2>
            <p class="muted">Instructor bio and Faculty Development acknowledgment: PLACEHOLDER.</p>
            <a class="button button-small" href="mailto:${esc(site.contactEmail)}">Contact John</a>
          </article>
        </div>
      </section>
      <section class="section section-tint">
        <div class="container"><div class="callout"><p class="eyebrow">Content currency</p><h2>Every capability claim needs a vintage stamp.</h2><p>AI capabilities change quickly. Modules and articles carry a last-reviewed date, while stable pedagogical values remain visible across revisions.</p>${site.lastReviewed ? `<p><strong>Site last reviewed:</strong> ${esc(site.lastReviewed)}</p>` : ""}</div></div>
      </section>
      ${ctaBanner()}`;
  }

  function renderThanks() {
    main.innerHTML = `
      ${pageHero("Thank you", "You are on the list.", "Watch for the next weekly update. In the meantime, the archive shows what the newsletter delivers.", `<div class="button-row"><a class="button" href="./">Return home</a><a class="button button-outline" href="updates/">Browse updates</a></div>`)}
    `;
  }

  function renderNotFound() {
    main.innerHTML = `
      ${pageHero("404", "This page is not part of the course arc.", "The link may be outdated or the resource may have moved.", `<div class="button-row"><a class="button" href="./">Return home</a><a class="button button-outline" href="course/">Open course hub</a></div>`)}
    `;
  }

  const renderers = {
    home: renderHome,
    course: renderCourse,
    module: renderModule,
    "key-terms": renderKeyTerms,
    articles: renderArticles,
    chatbots: renderChatbots,
    portfolio: renderPortfolio,
    start: renderStart,
    faq: renderFaq,
    updates: renderUpdates,
    subscribe: renderSubscribe,
    support: renderSupport,
    about: renderAbout,
    thanks: renderThanks,
    notfound: renderNotFound
  };

  async function init() {
    try {
      site = { ...FALLBACK_SITE, ...(await fetchData("site")) };
    } catch (error) {
      site = FALLBACK_SITE;
    }
    injectShell();
    injectAnalytics();
    try {
      await (renderers[page] || renderNotFound)();
      bindGlobalInteractions();
      handleHashTarget();
    } catch (error) {
      main.innerHTML = `<section class="section"><div class="narrow"><div class="empty-state"><h1>Content could not load</h1><p>${esc(error.message)}</p><p>If you are previewing locally, serve the website folder through a web server so JSON files can be fetched.</p></div></div></section>`;
      console.error(error);
    }
  }

  init();
})();
