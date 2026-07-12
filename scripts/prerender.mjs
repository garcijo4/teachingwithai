import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(root, "dist");
const progressSource = await readFile(path.join(root, "js", "progress.js"), "utf8");
const mainSource = await readFile(path.join(root, "js", "main.js"), "utf8");
const site = JSON.parse(await readFile(path.join(root, "data", "site.json"), "utf8"));
const modules = JSON.parse(await readFile(path.join(root, "data", "modules.json"), "utf8"));
const sessions = JSON.parse(await readFile(path.join(root, "data", "sessions.json"), "utf8"));
const financeApplications = JSON.parse(await readFile(path.join(root, "data", "finance-applications.json"), "utf8"));
const siteOrigin = String(site.siteUrl || "https://www.teachingwithai.app").replace(/\/$/, "");

const staticRoutes = [
  ["index.html", "index.html", "/"],
  ["course/index.html", "course/index.html", "/course/"],
  ["sessions/index.html", "sessions/index.html", "/sessions/"],
  ["key-terms/index.html", "key-terms/index.html", "/key-terms/"],
  ["articles/index.html", "articles/index.html", "/articles/"],
  ["chatbots/index.html", "chatbots/index.html", "/chatbots/"],
  ["portfolio/index.html", "portfolio/index.html", "/portfolio/"],
  ["start/index.html", "start/index.html", "/start/"],
  ["faq/index.html", "faq/index.html", "/faq/"],
  ["updates/index.html", "updates/index.html", "/updates/"],
  ["subscribe/index.html", "subscribe/index.html", "/subscribe/"],
  ["support/index.html", "support/index.html", "/support/"],
  ["about/index.html", "about/index.html", "/about/"],
  ["sessions/ai-in-finance/index.html", "sessions/ai-in-finance/index.html", "/sessions/ai-in-finance/"],
  ["sessions/ai-in-finance/prompts.html", "sessions/ai-in-finance/prompts.html", "/sessions/ai-in-finance/prompts.html"],
  ["sessions/ai-in-finance/quick-start.html", "sessions/ai-in-finance/quick-start.html", "/sessions/ai-in-finance/quick-start.html"],
  ["sessions/ai-in-finance/frameworks.html", "sessions/ai-in-finance/frameworks.html", "/sessions/ai-in-finance/frameworks.html"],
  ["sessions/ai-in-finance/ai-presentation.html", "sessions/ai-in-finance/ai-presentation.html", "/sessions/ai-in-finance/ai-presentation.html"],
  ["sessions/ai-in-finance/references.html", "sessions/ai-in-finance/references.html", "/sessions/ai-in-finance/references.html"],
  ["thanks.html", "thanks.html", "/thanks.html", { indexable: false }],
  ["subscribe/thanks/index.html", "subscribe/thanks/index.html", "/subscribe/thanks/", { indexable: false }],
  ["404.html", "404.html", "/404.html", { indexable: false, noindex: true }]
].map(([source, output, publicPath, options = {}]) => ({ source, output, publicPath, indexable: true, ...options }));

const moduleRoutes = modules.map((module) => ({
  source: "course/module.html",
  output: `course/modules/${module.id}/index.html`,
  publicPath: `/course/modules/${module.id}/`,
  dataset: { moduleId: String(module.id) },
  lastModified: module.lastReviewed || site.lastReviewed,
  indexable: true
}));

const sessionRoutes = sessions
  .filter((session) => session.type !== "guide" && session.id)
  .map((session) => ({
    source: "sessions/session.html",
    output: `sessions/${session.id}/index.html`,
    publicPath: `/sessions/${session.id}/`,
    dataset: { sessionId: session.id },
    lastModified: session.lastReviewed || site.lastReviewed,
    indexable: true
  }));

const financeApplicationRoutes = financeApplications.map((application) => ({
  source: "sessions/ai-in-finance/application.html",
  output: `sessions/ai-in-finance/applications/${application.id}/index.html`,
  publicPath: `/sessions/ai-in-finance/applications/${application.id}/`,
  dataset: { applicationId: String(application.id) },
  lastModified: application.lastReviewed || site.lastReviewed,
  indexable: true
}));

const legacyRoutes = [
  {
    source: "course/module.html",
    output: "course/module.html",
    publicPath: "/course/module.html?m=1",
    canonicalPath: "/course/modules/1/",
    dataset: { moduleId: "1" },
    indexable: false,
    noindex: true
  },
  {
    source: "sessions/session.html",
    output: "sessions/session.html",
    publicPath: "/sessions/session.html?s=ai-role-play",
    canonicalPath: "/sessions/ai-role-play/",
    dataset: { sessionId: "ai-role-play" },
    indexable: false,
    noindex: true
  },
  {
    source: "sessions/ai-in-finance/application.html",
    output: "sessions/ai-in-finance/application.html",
    publicPath: "/sessions/ai-in-finance/application.html?a=1",
    canonicalPath: "/sessions/ai-in-finance/applications/1/",
    dataset: { applicationId: "1" },
    indexable: false,
    noindex: true
  }
];

const routes = [...staticRoutes, ...moduleRoutes, ...sessionRoutes, ...financeApplicationRoutes, ...legacyRoutes];

await prepareOutput();
for (const route of routes) await renderRoute(route);
await writeSitemap(routes.filter((route) => route.indexable));
await validateOutput(routes);

console.log(`Prerendered ${routes.length} routes into ${path.relative(root, outputRoot)}.`);

async function prepareOutput() {
  await mkdir(outputRoot, { recursive: true });
  // Keep the output directory itself in place so a local preview server whose
  // working directory is dist/ does not make Windows builds fail with EBUSY.
  for (const entry of await readdir(outputRoot, { withFileTypes: true })) {
    await rm(path.join(outputRoot, entry.name), { recursive: true, force: true });
  }
  const excluded = new Set([".git", ".github", "dist", "node_modules", "package.json", "package-lock.json", ".gitignore", "README.md", "scripts", "netlify.toml"]);
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    await cp(path.join(root, entry.name), path.join(outputRoot, entry.name), { recursive: true });
  }
}

async function renderRoute(route) {
  const sourceHtml = await readFile(path.join(root, route.source), "utf8");
  const virtualConsole = new VirtualConsole();
  const errors = [];
  virtualConsole.on("jsdomError", (error) => errors.push(error));
  virtualConsole.on("error", (error) => errors.push(error));

  const dom = new JSDOM(sourceHtml, {
    url: `${siteOrigin}${route.publicPath}`,
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole
  });
  const { window } = dom;
  const { document } = window;

  for (const [key, value] of Object.entries(route.dataset || {})) document.body.dataset[key] = value;
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.scrollTo = () => {};
  Object.defineProperty(window.navigator, "clipboard", { value: { writeText: async () => {} }, configurable: true });
  window.fetch = async (resource) => localFetch(new URL(String(resource), document.baseURI));

  window.eval(progressSource);
  window.eval(mainSource);
  await waitForRender(document, route.publicPath);

  if (errors.length) throw new Error(`${route.publicPath}: ${errors.map((error) => error.message).join(" | ")}`);
  const main = document.querySelector("#main-content");
  if (!main || !main.querySelector("h1") || main.textContent.trim().length < 80) {
    throw new Error(`${route.publicPath}: prerendered main content is incomplete`);
  }

  document.documentElement.removeAttribute("data-render-state");
  document.documentElement.dataset.prerendered = "true";
  setCanonical(document, route.canonicalPath || route.publicPath);
  if (route.noindex) setMeta(document, "name", "robots", "noindex,follow");
  refreshDescription(document);
  refreshSocialMetadata(document);
  prepareGeneratedMarkup(document);

  const outputPath = path.join(outputRoot, route.output);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, dom.serialize(), "utf8");
  window.close();
}

async function localFetch(url) {
  if (url.origin !== siteOrigin) return response(404, "");
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const target = path.resolve(root, relative);
  if (!target.startsWith(`${root}${path.sep}`)) return response(403, "");
  try {
    return response(200, await readFile(target, "utf8"));
  } catch {
    return response(404, "");
  }
}

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(body),
    text: async () => body
  };
}

async function waitForRender(document, label) {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    if (document.documentElement.dataset.renderState === "complete") return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`${label}: renderer did not complete`);
}

function setCanonical(document, publicPath) {
  const url = `${siteOrigin}${publicPath}`;
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = url;
  setMeta(document, "property", "og:url", url);
}

function setMeta(document, attribute, key, content) {
  let meta = document.querySelector(`meta[${attribute}="${key}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function refreshDescription(document) {
  const text = document.querySelector("#main-content .lede, #main-content h1 + p")?.textContent.trim();
  if (!text) return;
  const description = text.length > 157 ? `${text.slice(0, 156).trimEnd()}…` : text;
  setMeta(document, "name", "description", description);
  setMeta(document, "property", "og:description", description);
  setMeta(document, "name", "twitter:description", description);
}

function refreshSocialMetadata(document) {
  const title = document.title.trim();
  if (!title) return;
  setMeta(document, "property", "og:title", title);
  setMeta(document, "name", "twitter:title", title);
}

function prepareGeneratedMarkup(document) {
  // Prerendered pages already contain their primary content, so the old
  // JavaScript-required fallback is both inaccurate and a duplicate heading.
  document.querySelectorAll("noscript").forEach((node) => node.remove());
  document.querySelectorAll("head script:not([src])").forEach((script) => {
    if (script.textContent.includes('location.hostname.endsWith("github.io")')) script.remove();
  });

  // Scripts inserted by the renderer are serialized into the generated HTML.
  // Preserve them, but make sure they cannot block parsing on first paint.
  document.querySelectorAll('script[src^="http://"], script[src^="https://"]').forEach((script) => {
    if (script.hasAttribute("async") || script.hasAttribute("defer")) return;
    if (script.hasAttribute("data-goatcounter")) script.setAttribute("async", "");
    else script.setAttribute("defer", "");
  });
}

async function writeSitemap(indexableRoutes) {
  const defaultLastModified = site.lastReviewed || new Date().toISOString().slice(0, 10);
  const uniqueRoutes = new Map();
  for (const route of indexableRoutes) {
    const publicPath = route.canonicalPath || route.publicPath;
    if (!uniqueRoutes.has(publicPath)) uniqueRoutes.set(publicPath, route);
  }
  const rows = [...uniqueRoutes].map(([publicPath, route]) => {
    const lastModified = route.lastModified || defaultLastModified;
    return `  <url><loc>${escapeXml(`${siteOrigin}${publicPath}`)}</loc><lastmod>${lastModified}</lastmod></url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
  await writeFile(path.join(outputRoot, "sitemap.xml"), xml, "utf8");
}

function escapeXml(value) {
  return String(value).replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character]);
}

async function validateOutput(expectedRoutes) {
  for (const route of expectedRoutes) {
    const html = await readFile(path.join(outputRoot, route.output), "utf8");
    if (!html.includes('data-prerendered="true"')) throw new Error(`${route.output}: missing prerender marker`);
    if (/<main id="main-content"[^>]*>\s*<\/main>/.test(html)) throw new Error(`${route.output}: empty main content`);
  }
}
