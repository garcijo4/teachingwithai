(function () {
  "use strict";

  const page = document.body.dataset.page || "home";
  const main = document.querySelector("#main-content");
  const dataCache = new Map();
  const basePath = new URL(document.baseURI).pathname.replace(/\/$/, "");
  const currentPath = location.pathname.startsWith(basePath)
    ? location.pathname.slice(basePath.length) || "/"
    : location.pathname;

  const navItems = [
    ["Home", "./", "/"],
    ["Course", "course/", "/course/"],
    ["Key Terms", "key-terms/", "/key-terms/"],
    ["Articles", "articles/", "/articles/"],
    ["Chatbots", "chatbots/", "/chatbots/"],
    ["About", "about/", "/about/"]
  ];

  const courseOpeningVideos = [
    {
      id: "introduction-video",
      title: "Introduction Video",
      duration: "1.83 min",
      transcript: "A brief welcome and orientation to the Teaching with AI course."
    },
    {
      id: "course-overview-intro",
      title: "Course Overview Intro",
      duration: "7.75 min",
      transcript: "An overview of the course stance, six-module arc, and portfolio outcomes."
    }
  ];

  const courseConclusionVideo = {
    id: "conclusion-video",
    title: "Conclusion Video",
    duration: "2.13 min",
    transcript: "A closing reflection and invitation to carry the portfolio into the next teaching term."
  };

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

  function isCurrent(matchPath) {
    if (matchPath === "/") return currentPath === "/";
    return currentPath.startsWith(matchPath);
  }

  function injectShell() {
    const header = document.querySelector("#site-header");
    const footer = document.querySelector("#site-footer");
    const subject = encodeURIComponent(`Question about ${document.title || "Teaching with AI"}`);

    header.innerHTML = `
      <a class="skip-link" href="#main-content">Skip to content</a>
      <div class="site-header">
        <div class="container header-inner">
          <a class="wordmark" href="./">
            <strong>Teaching with AI</strong>
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
              <form class="footer-form" name="weekly-updates" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="thanks.html" data-wireframe-form>
                <input type="hidden" name="form-name" value="weekly-updates">
                <p hidden><input name="bot-field"></p>
                <label class="small" for="footer-email">Email address</label>
                <input id="footer-email" type="email" name="email" required placeholder="you@example.edu">
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
              <p class="small">Progress is stored only in this browser. Do not enter student data into faculty-support chatbots.</p>
              <a class="button button-light button-small" href="mailto:jgarcia@callutheran.edu?subject=${subject}">Email John</a>
            </div>
          </div>
          <div class="footer-bottom">
            <span>&copy; <span data-current-year></span> Teaching with AI</span>
            <span>Wireframe prototype | Last reviewed June 9, 2026</span>
          </div>
        </div>
      </footer>
      <a class="ask-john" href="mailto:jgarcia@callutheran.edu?subject=${subject}">? Stuck? Ask John</a>
      <div class="toast" role="status" aria-live="polite"></div>`;

    document.querySelector("[data-current-year]").textContent = new Date().getFullYear();

    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".site-nav");
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      toggle.textContent = expanded ? "Menu" : "Close";
      nav.classList.toggle("is-open", !expanded);
      document.body.classList.toggle("menu-open", !expanded);
    });

    nav.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Menu";
      nav.classList.remove("is-open");
      document.body.classList.remove("menu-open");
    });
  }

  function showToast(message) {
    const toast = document.querySelector(".toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  function placeholderButton(label, extraClass = "") {
    return `<a class="button ${extraClass}" href="#" data-placeholder>${label}</a>`;
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

  function moduleItemIds(module) {
    return [...module.videos.map((video) => video.id), ...module.worksheets.map((worksheet) => worksheet.id)];
  }

  function moduleCard(module) {
    const percent = CourseProgress.percent(moduleItemIds(module));
    return `
      <article class="card module-card">
        <div class="module-number">${module.id}</div>
        <div class="badge-row">${badge(`${module.duration} video`)} ${badge(`Express ${module.express}`, "badge-gold")}</div>
        <h3>${module.title}</h3>
        <p class="muted">${module.description}</p>
        <p class="small"><strong>Portfolio artifact:</strong> ${module.artifact}</p>
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

  function videoPlaceholder(title, label = "ScreenPal video placeholder") {
    return `
      <div class="video-placeholder" data-video-placeholder>
        <div class="video-placeholder-content">
          <button class="play-button" type="button" aria-label="Preview placeholder for ${title}">Play</button>
          <strong>${label}</strong>
          <p class="small">Click to preview the embed state.</p>
        </div>
      </div>`;
  }

  function bindGlobalInteractions() {
    document.querySelectorAll("[data-placeholder]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        showToast("This external URL is intentionally marked PLACEHOLDER in the wireframe.");
      });
    });

    document.querySelectorAll("[data-video-placeholder] .play-button").forEach((button) => {
      button.addEventListener("click", () => {
        const panel = button.closest("[data-video-placeholder]");
        panel.innerHTML = `<div class="video-placeholder-content"><strong>Embed loaded state</strong><p class="small">Replace PLACEHOLDER with a ScreenPal or HeyGen embed URL.</p></div>`;
        showToast("Video interaction works; the external embed URL is still a placeholder.");
      });
    });

    document.querySelectorAll("[data-wireframe-form]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        showToast("Form markup is Netlify-ready. Submission is disabled in this wireframe.");
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

  async function renderHome() {
    const [modules, articles, chatbots] = await Promise.all([fetchData("modules"), fetchData("articles"), fetchData("chatbots")]);
    const state = CourseProgress.read();
    const lastId = state._last;
    const lastModule = modules.find((module) => moduleItemIds(module).includes(lastId));
    const continueContent = lastModule
      ? `<div class="continue-banner"><div><strong>Continue where you left off</strong><p>Return to Module ${lastModule.id}: ${lastModule.shortTitle}.</p></div><a class="button button-small" href="course/module.html?m=${lastModule.id}">Continue Module ${lastModule.id}</a></div>`
      : `<div class="continue-banner"><div><strong>Your progress stays private.</strong><p>Complete checkboxes as you go. Progress is stored only in this browser.</p></div><a class="button button-small" href="course/">View course</a></div>`;

    main.innerHTML = `
      <section class="hero">
        <div class="container">
          <p class="eyebrow">A 3-hour asynchronous faculty course</p>
          <h1>Teaching with Artificial Intelligence</h1>
          <p class="lede">Grounded Curiosity. Defensible Choices. Portfolio Outcomes.</p>
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
            <div class="stat"><strong>3 hours</strong><span>Total lecture runtime</span></div>
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
            ${modules.map((module) => `<a class="arc-stop" data-number="${module.id}" href="course/module.html?m=${module.id}"><strong>${module.shortTitle}</strong><small>${module.duration} video | ${CourseProgress.percent(moduleItemIds(module))}% complete</small></a>`).join("")}
          </div>
        </div>
      </section>
      <section class="section section-tint">
        <div class="container">
          <div class="section-heading"><div><p class="eyebrow">A different kind of AI course</p><h2>Pedagogy first. Durable by design.</h2></div></div>
          <div class="grid grid-3">
            <article class="card"><div class="card-icon">01</div><h3>Not a tool tour</h3><p>Tools change. The course builds judgment around learning, evidence, and disciplinary values.</p></article>
            <article class="card"><div class="card-icon">02</div><h3>Every module produces something</h3><p>Leave with policy, assignment, audit, and implementation documents you can use.</p></article>
            <article class="card"><div class="card-icon">03</div><h3>Anchored in named frameworks</h3><p><abbr title="AI Assessment Scale">AIAS</abbr>, TILT, Safety Gap, and Oracle/Tutor/Adversary turn intuition into explainable choices.</p></article>
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
  }

  async function renderCourse() {
    const modules = await fetchData("modules");
    main.innerHTML = `
      ${pageHero("Course hub", "Six modules. One teaching-ready portfolio.", "Move from disciplinary values to a redesigned assignment, transparent policy, and a sustainable six-month plan.", `<div class="button-row"><a class="button" href="start/">Choose a quick-start path</a><a class="button button-outline" href="portfolio/">Open portfolio checklist</a></div>`)}
      <section class="section-sm">
        <div class="container">
          <div class="callout">
            <h3>How to take this course</h3>
            <p>The complete lecture sequence runs 176.42 minutes, or about 3 hours. Use one real course as your design substrate. Complete the modules in sequence for the strongest portfolio story, or begin with the problem you need to solve.</p>
            <p class="small muted">Progress is stored only in this browser. <button class="copy-link" type="button" data-reset-progress>Reset my progress</button></p>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <div class="section-heading"><div><p class="eyebrow">Begin here</p><h2>Course introduction and overview</h2><p>These two short videos orient you to the course before you enter Module 1.</p></div></div>
          <div class="grid grid-2">${courseOpeningVideos.map(renderVideoCard).join("")}</div>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <div class="section-heading"><div><p class="eyebrow">The full course</p><h2>Build the design story</h2></div></div>
          <div class="grid grid-3">${modules.map(moduleCard).join("")}</div>
        </div>
      </section>
      <section class="section section-tint">
        <div class="container">
          <div class="section-heading"><div><p class="eyebrow">Complete the arc</p><h2>Course conclusion</h2><p>Close the course after assembling your portfolio and six-month plan.</p></div></div>
          <div class="narrow">${renderVideoCard(courseConclusionVideo)}</div>
        </div>
      </section>
      ${ctaBanner()}`;

    bindProgressCheckboxes();
  }

  function renderVideoCard(video) {
    const checked = CourseProgress.isComplete(video.id);
    return `
      <article class="video-card" id="video-${video.id}">
        ${videoPlaceholder(video.title)}
        <div class="module-meta"><span>${video.duration}</span><span class="placeholder-note">External URL: PLACEHOLDER</span></div>
        <h3>${video.title}</h3>
        <label class="check-row"><input type="checkbox" data-progress-id="${video.id}" ${checked ? "checked" : ""}><span><strong>Mark video complete</strong><br><span class="small muted">Stored only in this browser</span></span></label>
        <details><summary>Read transcript preview</summary><div class="details-body"><p>${video.transcript}</p><p class="small">Full transcript will be loaded from the final content data.</p></div></details>
      </article>`;
  }

  function renderWorksheet(worksheet) {
    const checked = CourseProgress.isComplete(worksheet.id);
    return `
      <article class="resource-card">
        <div class="resource-icon">DOC</div>
        <div>
          <h3>${worksheet.title}</h3>
          <p class="small muted">${worksheet.minutes} | Google Drive /copy and export links: PLACEHOLDER</p>
          <label class="check-row"><input type="checkbox" data-progress-id="${worksheet.id}" ${checked ? "checked" : ""}><span>Mark complete</span></label>
        </div>
        ${placeholderButton("Make your own copy", "button-small")}
      </article>`;
  }

  async function renderModule() {
    const modules = await fetchData("modules");
    const moduleId = Number(new URLSearchParams(location.search).get("m"));
    const module = modules.find((item) => item.id === moduleId);
    if (!module) {
      location.replace("course/");
      return;
    }

    document.title = `Module ${module.id}: ${module.shortTitle} | Teaching with AI`;
    const moduleSubject = encodeURIComponent(`Question about Module ${module.id}`);
    document.querySelectorAll(".ask-john, .site-footer a[href^='mailto:']").forEach((link) => {
      link.href = `mailto:jgarcia@callutheran.edu?subject=${moduleSubject}`;
    });
    const ids = moduleItemIds(module);
    const percent = CourseProgress.percent(ids);
    const previous = modules[module.id - 2];
    const next = modules[module.id];

    main.innerHTML = `
      <section class="page-hero">
        <div class="container">
          <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="course/">Course</a><span>&rsaquo;</span><span>Module ${module.id}</span></nav>
          <div class="badge-row">${badge(`Module ${module.id}`)} ${badge(`${module.duration} video`)} ${badge(`Express ${module.express}`, "badge-gold")} ${badge(`Reviewed ${module.lastReviewed}`)}</div>
          <h1>${module.title}</h1>
          <p class="lede">${module.description}</p>
          <div style="max-width:620px">${progressBar(percent)}<p class="small muted"><span data-module-percent>${percent}</span>% complete in this browser</p></div>
        </div>
      </section>
      <section class="section">
        <div class="container content-layout">
          <div class="stack">
            <section>
              <p class="eyebrow">Learning objectives</p>
              <h2>What you will be able to do</h2>
              <div class="card"><ul>${module.objectives.map((objective) => `<li>${objective}</li>`).join("")}</ul></div>
            </section>
            <section>
              <p class="eyebrow">Time budget</p>
              <div class="callout callout-gold"><h3>${module.duration} total lecture runtime | ${module.express} express path</h3><p>The listed runtime reflects the current module lectures. Worksheets and optional portfolio activities add time based on how deeply you choose to engage.</p></div>
            </section>
            <section id="videos">
              <p class="eyebrow">Watch and reflect</p>
              <h2>Module videos</h2>
              <div class="stack">${module.videos.map(renderVideoCard).join("")}</div>
            </section>
            <section id="worksheets">
              <p class="eyebrow">Make the work usable</p>
              <h2>Worksheets and resources</h2>
              <p class="muted">Final links will offer a one-click Google copy and Word/PDF export. All links are placeholders in this wireframe.</p>
              <div class="resource-list">${module.worksheets.map(renderWorksheet).join("")}</div>
            </section>
            <section>
              <p class="eyebrow">Slides</p>
              <div class="resource-card">
                <div class="resource-icon">PDF</div>
                <div><h3>Module ${module.id} slide deck</h3><p class="small muted">Google Drive preview and PDF URL: PLACEHOLDER</p></div>
                ${placeholderButton("Preview slides", "button-small")}
              </div>
            </section>
            <section>
              <p class="eyebrow">Portfolio connection</p>
              <div class="callout"><h2>${module.artifact}</h2><p>By the end of this module, this artifact should be ready to carry into the next design decision.</p><a class="button button-small" href="portfolio/">Open portfolio checklist</a></div>
            </section>
            <section>
              <p class="eyebrow">Quick feedback</p>
              <div class="form-card">
                <h2>Was this module helpful?</h2>
                <form class="form-grid" name="module-feedback" method="POST" data-netlify="true" data-wireframe-form>
                  <input type="hidden" name="form-name" value="module-feedback">
                  <input type="hidden" name="module" value="${module.id}">
                  <div class="feedback-buttons"><button class="button button-outline button-small" name="helpful" value="yes" type="submit">Yes, helpful</button><button class="button button-outline button-small" name="helpful" value="no" type="submit">Not yet</button></div>
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
              <div class="badge-row">${module.relatedTerms.map((term) => `<a class="badge" href="key-terms/#${term}">${term.replaceAll("-", " ")}</a>`).join("")}</div>
            </div>
            <div class="card">
              <h3>Stuck on Module ${module.id}?</h3>
              <p class="small muted">A human escape hatch matters. Ask a focused question and include the page or item name.</p>
              <a class="button button-small" href="mailto:jgarcia@callutheran.edu?subject=${encodeURIComponent(`Question about Module ${module.id}`)}">Ask John</a>
            </div>
            <div class="card"><p class="small muted">Progress is stored only in this browser.</p><button class="copy-link" type="button" data-reset-progress>Reset my progress</button></div>
          </aside>
        </div>
      </section>
      ${ctaBanner()}`;

    bindProgressCheckboxes(ids);
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

  function termCard(term) {
    return `
      <article class="card term-card" id="${term.slug}" data-term-module="${term.module}" data-term-search="${term.term.toLowerCase()} ${term.definition.toLowerCase()}">
        <div class="badge-row">${badge(`Module ${term.module}`)}</div>
        <h3>${term.term}</h3>
        <p>${term.definition}</p>
        ${videoPlaceholder(term.term, "HeyGen / ScreenPal placeholder")}
        <details><summary>Read full script</summary><div class="details-body"><p>${term.script}</p></div></details>
        <button class="copy-link" type="button" data-copy-term="${term.slug}">Copy link to this term</button>
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
          <div class="az-bar" aria-label="Available first letters">${letters.map((letter) => `<span>${letter}</span>`).join("")}</div>
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
  }

  function articleCard(article) {
    return `
      <article class="card article-card" data-article-tags="${article.tags.join(" ")}">
        <div class="badge-row">${article.tags.map((tag) => badge(tag)).join("")}</div>
        <div class="article-meta"><span>${article.source}</span><span>${article.date}</span></div>
        <h3>${article.title}</h3>
        <p>${article.annotation}</p>
        ${placeholderButton("Read article", "button-outline button-small")}
      </article>`;
  }

  async function renderArticles() {
    const articles = await fetchData("articles");
    const tags = [...new Set(articles.flatMap((article) => article.tags))].sort();
    main.innerHTML = `
      ${pageHero("Curated context", "AI and teaching, with a reason to read.", "Each featured article includes a short explanation of why it matters for faculty. External URLs remain placeholders in this wireframe.")}
      <section class="section">
        <div class="container">
          <div class="filter-bar" aria-label="Filter articles">
            <button class="filter-button" type="button" aria-pressed="true" data-article-filter="all">All</button>
            ${tags.map((tag) => `<button class="filter-button" type="button" aria-pressed="false" data-article-filter="${tag}">${tag}</button>`).join("")}
          </div>
          <div class="grid grid-3">${articles.map(articleCard).join("")}</div>
        </div>
      </section>
      <section class="section section-tint">
        <div class="container">
          <p class="eyebrow">Recent from around the web</p>
          <h2>Daily RSS cache</h2>
          <div class="empty-state"><span class="placeholder-note">Scheduled feed: PLACEHOLDER</span><p style="margin-top:1rem">This area will load a cached feed generated by a Netlify Scheduled Function. It hides gracefully when the feed is unavailable.</p></div>
          <p class="small muted" style="margin-top:1rem">External links do not imply endorsement.</p>
        </div>
      </section>
      ${ctaBanner()}`;

    document.querySelectorAll("[data-article-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.articleFilter;
        document.querySelectorAll("[data-article-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        document.querySelectorAll(".article-card").forEach((card) => {
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
            ${chatbots.map((bot) => `
              <article class="card ${bot.status === "coming-soon" ? "status-coming" : ""}">
                <div class="badge-row">${badge(bot.status === "coming-soon" ? "Coming soon" : "Live", bot.status === "live" ? "badge-success" : "badge-gold")}</div>
                <div class="card-icon">${bot.icon}</div>
                <h3>${bot.name}</h3>
                <p>${bot.description}</p>
                <ul>${bot.capabilities.map((capability) => `<li>${capability}</li>`).join("")}</ul>
                <h4>Starter prompts</h4>
                <ul class="starter-prompts">${bot.prompts.map((prompt) => `<li>&ldquo;${prompt}&rdquo;</li>`).join("")}</ul>
                <p class="small muted"><strong>Expectation:</strong> ${bot.expectation}</p>
                ${placeholderButton("Launch chatbot", "button-small")}
              </article>`).join("")}
          </div>
        </div>
      </section>
      ${ctaBanner()}`;
  }

  async function renderPortfolio() {
    const modules = await fetchData("modules");
    const artifactIds = modules.map((module) => `artifact-${module.id}`);
    main.innerHTML = `
      ${pageHero("Course redesign portfolio", "Six connected artifacts. One usable teaching packet.", "Track the documents you have built, make a copy of the final workbook, and print a completion summary when the packet is ready.", `<div class="button-row">${placeholderButton("Make a copy of the Portfolio Workbook")}<button class="button button-outline" type="button" onclick="window.print()">Print completion summary</button></div>`)}
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
                <input type="checkbox" aria-label="Mark ${module.artifact} complete" data-progress-id="artifact-${module.id}" ${CourseProgress.isComplete(`artifact-${module.id}`) ? "checked" : ""}>
                <div><div class="badge-row">${badge(`Module ${module.id}`)}</div><h3>${module.artifact}</h3><p class="muted">${module.description}</p></div>
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
    const paths = await fetchData("quickstart");
    main.innerHTML = `
      ${pageHero("Quick start", "Make the time you have count.", "Choose a realistic path, make one defensible change, and return when you have more room.")}
      <section class="section">
        <div class="container">
          <div class="grid grid-2">
            ${paths.map((path) => `
              <article class="card">
                <div class="badge-row">${badge(path.minutes, "badge-gold")}</div>
                <h2>${path.label}</h2>
                <p>${path.description}</p>
                <div class="timeline">${path.steps.map((step, index) => `<div class="timeline-item" data-step="${index + 1}"><h3><a href="${step.url}">${step.title}</a></h3><p class="small muted">${step.minutes}</p></div>`).join("")}</div>
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
    const faq = await fetchData("faq");
    main.innerHTML = `
      ${pageHero("Faculty FAQ", "Direct answers for real course constraints.", "The course is designed for busy faculty, uneven support, different disciplines, and legitimate skepticism.")}
      <section class="section"><div class="narrow">${faq.map((item) => `<details><summary>${item.question}</summary><div class="details-body"><p>${item.answer}</p></div></details>`).join("")}</div></section>
      ${ctaBanner()}`;
  }

  async function renderUpdates() {
    const updates = await fetchData("updates");
    main.innerHTML = `
      ${pageHero("Weekly update archive", "See what the newsletter delivers.", "Past updates remain linkable and useful after the week they were sent.", `<div class="button-row"><a class="button" href="subscribe/">Subscribe to weekly updates</a></div>`)}
      <section class="section"><div class="narrow stack">${updates.map((update) => `<article class="card"><div class="article-meta"><span>${update.date}</span></div><h2>${update.headline}</h2><p>${update.body}</p><div class="button-row">${update.links.map((link) => `<a class="button button-outline button-small" href="${link.url}">${link.title}</a>`).join("")}</div></article>`).join("")}</div></section>
      ${ctaBanner()}`;
  }

  function renderSubscribe() {
    main.innerHTML = `
      ${pageHero("Weekly update", "Useful developments, without the headline chase.", "New articles, course improvements, and faculty-support tools in one short weekly email.")}
      <section class="section">
        <div class="narrow">
          <div class="form-card">
            <form class="form-grid" name="weekly-updates" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="thanks.html" data-wireframe-form>
              <input type="hidden" name="form-name" value="weekly-updates">
              <p hidden><input name="bot-field"></p>
              <div class="form-field"><label for="name">Name <span class="muted">(optional)</span></label><input id="name" type="text" name="name" autocomplete="name"></div>
              <div class="form-field"><label for="email">Email address</label><input id="email" type="email" name="email" required autocomplete="email"></div>
              <label class="check-row"><input type="checkbox" name="clu-faculty"><span>I teach at Cal Lutheran</span></label>
              <button class="button" type="submit">Subscribe</button>
            </form>
            <p class="small muted" style="margin-top:1rem">Your email is used only for the weekly update. Unsubscribe anytime. Submission is disabled in this wireframe.</p>
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
            ${placeholderButton("Buy John a Coffee", "button-gold")}
            <p class="small muted" style="margin-top:1rem">Support URL: PLACEHOLDER</p>
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
            <a class="button button-small" href="mailto:jgarcia@callutheran.edu">Contact John</a>
          </article>
        </div>
      </section>
      <section class="section section-tint">
        <div class="container"><div class="callout"><p class="eyebrow">Content currency</p><h2>Every capability claim needs a vintage stamp.</h2><p>AI capabilities change quickly. Modules and articles carry a last-reviewed date, while stable pedagogical values remain visible across revisions.</p><p><strong>Wireframe last reviewed:</strong> June 9, 2026</p></div></div>
      </section>
      ${ctaBanner()}`;
  }

  function renderThanks() {
    main.innerHTML = `
      ${pageHero("Thank you", "You are on the list.", "This is the Netlify form success-page wireframe. In the live site, subscribers will arrive here after submitting the form.", `<div class="button-row"><a class="button" href="./">Return home</a><a class="button button-outline" href="updates/">Browse updates</a></div>`)}
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
    injectShell();
    try {
      await (renderers[page] || renderNotFound)();
      bindGlobalInteractions();
    } catch (error) {
      main.innerHTML = `<section class="section"><div class="narrow"><div class="empty-state"><h1>Wireframe content could not load</h1><p>${error.message}</p><p>Serve the website folder through a local web server so JSON files can be fetched.</p></div></div></section>`;
      console.error(error);
    }
  }

  init();
})();

