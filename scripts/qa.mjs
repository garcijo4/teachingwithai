import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(root, "dist");
const site = JSON.parse(await readFile(path.join(root, "data", "site.json"), "utf8"));
const expectedOrigin = String(site.siteUrl || "https://www.teachingwithai.app").replace(/\/$/, "");
const failures = [];
const ignoredDirectories = new Set([".netlify", "node_modules"]);
const htmlFiles = await findHtmlFiles(outputRoot);

for (const file of htmlFiles) await inspectPage(file);
await inspectSitemap();

if (failures.length) {
  console.error(`QA failed with ${failures.length} issue${failures.length === 1 ? "" : "s"}:`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`QA passed for ${htmlFiles.length} HTML files: metadata, headings, IDs, scripts, links, assets, and sitemap.`);
}

async function findHtmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) files.push(...await findHtmlFiles(candidate));
    else if (entry.name.endsWith(".html")) files.push(candidate);
  }
  return files.sort();
}

async function inspectPage(file) {
  const relative = path.relative(outputRoot, file).replaceAll(path.sep, "/");
  const html = await readFile(file, "utf8");
  const dom = new JSDOM(html, { url: `${expectedOrigin}/${relative}` });
  const { document } = dom.window;
  const label = relative;
  const title = document.title.trim();
  const canonical = document.querySelector('link[rel="canonical"]')?.href || "";
  const ogTitle = meta(document, "property", "og:title");
  const twitterTitle = meta(document, "name", "twitter:title");
  const description = meta(document, "name", "description");
  const ogDescription = meta(document, "property", "og:description");
  const ogUrl = meta(document, "property", "og:url");

  check(title, label, "missing document title");
  check(canonical.startsWith(`${expectedOrigin}/`), label, `invalid canonical: ${canonical || "missing"}`);
  check(ogTitle === title, label, "og:title does not match document title");
  check(twitterTitle === title, label, "twitter:title does not match document title");
  check(Boolean(description), label, "missing meta description");
  check(ogDescription === description, label, "og:description does not match meta description");
  check(ogUrl === canonical, label, "og:url does not match canonical");
  check(!document.querySelector("noscript"), label, "contains stale noscript fallback");

  const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
  const duplicates = [...new Set(ids.filter((id, index) => id && ids.indexOf(id) !== index))];
  check(!duplicates.length, label, `duplicate IDs: ${duplicates.join(", ")}`);

  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")];
  check(headings.filter((heading) => heading.tagName === "H1").length === 1, label, "must contain exactly one h1");
  for (let index = 1; index < headings.length; index += 1) {
    const previous = Number(headings[index - 1].tagName.slice(1));
    const current = Number(headings[index].tagName.slice(1));
    check(current <= previous + 1, label, `heading skips from h${previous} to h${current}: ${headings[index].textContent.trim()}`);
  }

  for (const script of document.querySelectorAll("script[src]")) {
    const source = script.getAttribute("src") || "";
    if (/^https?:\/\//i.test(source)) {
      check(script.hasAttribute("async") || script.hasAttribute("defer"), label, `external script blocks parsing: ${source}`);
    }
  }

  for (const link of document.querySelectorAll('a[target="_blank"]')) {
    const rel = new Set((link.getAttribute("rel") || "").split(/\s+/));
    check(rel.has("noopener") && rel.has("noreferrer"), label, `target=_blank link lacks noopener noreferrer: ${link.getAttribute("href")}`);
  }

  for (const element of document.querySelectorAll("a[href], link[href], script[src], img[src], iframe[src], source[src]")) {
    const attribute = element.hasAttribute("href") ? "href" : "src";
    await inspectReference(element.getAttribute(attribute), file, label);
  }
  dom.window.close();
}

async function inspectReference(reference, sourceFile, label) {
  if (!reference || reference === "#" || /^(?:https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(reference)) return;
  check(!reference.includes("PLACEHOLDER"), label, `placeholder reference: ${reference}`);
  const [pathname, fragment = ""] = reference.split("#", 2);
  if (!pathname && fragment) {
    const document = new JSDOM(await readFile(sourceFile, "utf8")).window.document;
    check(Boolean(document.getElementById(decodeURIComponent(fragment))), label, `missing local fragment: #${fragment}`);
    return;
  }

  // The source shells define <base href="/">, so relative site references are
  // root-relative even on deeply nested generated pages.
  const resolved = new URL(pathname, `${expectedOrigin}/`);
  if (resolved.origin !== expectedOrigin) return;
  let target = decodeURIComponent(resolved.pathname).replace(/^\/+/, "");
  if (!target || target.endsWith("/")) target += "index.html";
  const targetPath = path.resolve(outputRoot, target);
  check(targetPath === outputRoot || targetPath.startsWith(`${outputRoot}${path.sep}`), label, `reference escapes output: ${reference}`);
  if (!(targetPath === outputRoot || targetPath.startsWith(`${outputRoot}${path.sep}`))) return;
  try {
    await access(targetPath);
  } catch {
    fail(label, `broken internal reference: ${reference}`);
    return;
  }
  if (fragment && targetPath.endsWith(".html")) {
    const targetDocument = new JSDOM(await readFile(targetPath, "utf8")).window.document;
    check(Boolean(targetDocument.getElementById(decodeURIComponent(fragment))), label, `missing fragment in ${reference}`);
  }
}

async function inspectSitemap() {
  const xml = await readFile(path.join(outputRoot, "sitemap.xml"), "utf8");
  const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const lastModified = [...xml.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map((match) => match[1]);
  check(locations.length > 0, "sitemap.xml", "contains no URLs");
  check(new Set(locations).size === locations.length, "sitemap.xml", "contains duplicate URLs");
  check(locations.every((location) => location.startsWith(`${expectedOrigin}/`)), "sitemap.xml", "contains a noncanonical hostname");
  check(lastModified.length === locations.length, "sitemap.xml", "every URL must have lastmod");
  check(lastModified.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)), "sitemap.xml", "contains invalid lastmod date");

  const seenCanonicals = new Set();
  for (const location of locations) {
    const url = new URL(location);
    let target = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    if (!target || target.endsWith("/")) target += "index.html";
    const targetPath = path.join(outputRoot, target);
    try {
      const document = new JSDOM(await readFile(targetPath, "utf8"), { url: location }).window.document;
      const canonical = document.querySelector('link[rel="canonical"]')?.href || "";
      check(canonical === location, "sitemap.xml", `canonical mismatch for ${location}`);
      check(!seenCanonicals.has(canonical), "sitemap.xml", `duplicate canonical: ${canonical}`);
      seenCanonicals.add(canonical);
    } catch {
      fail("sitemap.xml", `route is missing generated HTML: ${location}`);
    }
  }
}

function meta(document, attribute, key) {
  return document.querySelector(`meta[${attribute}="${key}"]`)?.content.trim() || "";
}

function check(condition, label, message) {
  if (!condition) fail(label, message);
}

function fail(label, message) {
  failures.push(`${label}: ${message}`);
}
