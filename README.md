# Teaching with AI — Website

The faculty-development website for **Teaching with Artificial Intelligence**
(California Lutheran University). Plain HTML, CSS, vanilla JavaScript, and
editable JSON files. No build step.

## Where it lives

- **Production:** https://teachingwithartificialintelligence.netlify.app/
  (Netlify builds automatically from the GitHub repo's `main` branch)
- **GitHub Pages preview:** https://garcijo4.github.io/teachingwithai/
  (deployed by `.github/workflows/pages.yml`; useful as a staging check)

Push to `main` → GitHub Pages and Netlify both redeploy. Netlify is the
canonical site: all `<link rel="canonical">`, sitemap, and robots URLs point
there, and **forms only work on Netlify** (GitHub Pages cannot accept POSTs).

## Preview locally

From the `website` folder, run any static server, then open
`http://127.0.0.1:8080/`:

```powershell
python -m http.server 8080
```

Don't open files via `file://` — pages fetch JSON and need a web server.

## Editing content (the JSON layer)

All owner-editable content lives in `data/`. **You never need to touch HTML or
JS to update content.**

| File | Controls |
|---|---|
| `site.json` | Site name, tagline, contact email, support URL, site URL, last-reviewed date, intro/conclusion videos, analytics code |
| `modules.json` | Module titles, objectives, videos, reading, worksheets, slides, artifacts |
| `sessions.json` | Standalone sessions (outside the course): title, blurb, video, slides, worksheet, try-it steps, related modules/terms. Add an object to the array and the listing page, session page, and homepage strip update automatically |
| `finance-applications.json` | Finance guide (SWFA companion): the 10 ranked applications shown at `/sessions/ai-in-finance/`. Each entry holds title, difficulty, tagline, summary, and ordered content sections |
| `finance-prompts.json` | Finance guide prompt library: every prompt with title, source application, difficulty, and full text (one-click copy on the page) |
| `finance-quickstart.json` | Finance guide first-week pilots, one card per application |
| `finance-frameworks.json`, `finance-presentation.json`, `finance-references.json` | Finance guide appendix pages (OECD frameworks, slide-generation tutorial, reference list) |
| `key-terms.json` | Glossary definitions, video scripts, tooltip aliases |
| `articles.json` | Curated article cards |
| `feeds.json` | RSS feeds for the auto-updating articles section |
| `chatbots.json` | Chatbot directory (set `"status": "live"` + real `url` to activate a Launch button) |
| `quickstart.json` | Time-based quick-start paths |
| `faq.json` | FAQ entries |
| `updates.json` | Newsletter archive |

### The PLACEHOLDER convention

Any URL field still set to `PLACEHOLDER` renders as a disabled "coming soon"
control. **Paste a real URL into the JSON and the button or video goes live
automatically** — no other change needed. This applies to:

- `embedUrl` on every video (lecture videos render an embedded ScreenPal player
  directly; key-term videos use a click-to-load panel)
- `url` (Google Doc `/copy` link) and `exportUrl` (Word/PDF export) on worksheets
- `url` (read online) and `exportUrl` (Word/PDF download) on each module's `reading`
  (the "Module reading" card between videos and worksheets; counts toward module progress)
- `pdfUrl` / `previewUrl` on each module's `slides`
- `url` on articles and chatbots
- `supportUrl` and `portfolioWorkbookUrl` in `site.json`

### Useful extras

- **Runtime tokens:** `{{TOTAL_RUNTIME}}`, `{{TOTAL_MINUTES}}`, `{{TOTAL_HOURS}}`
  in `faq.json` / `quickstart.json` are replaced with totals computed from
  `modules.json`, so durations never drift when videos change.
- **Express path:** add `"express": true` to a video in `modules.json` to give
  it a gold "Express path" badge (the module page then explains the badge).
- **Video summaries:** each video's `summary` field renders as a collapsible
  "Video summary" dropdown under the player. Edit the text in `modules.json`
  (or `site.json` for the intro/conclusion videos).
- **Term tooltips:** module descriptions and objectives automatically link
  glossary terms (dotted underline + hover definition). Matching uses each
  term's `term` plus its `aliases` array in `key-terms.json`.
- **Analytics:** create a free GoatCounter account, then set
  `"goatcounterCode": "yourcode"` in `site.json` (the part before
  `.goatcounter.com`). Leave empty for no analytics. Cookieless — no banner needed.

## Forms (Netlify)

Two forms: `weekly-updates` (footer + subscribe page) and `module-feedback`
(every module page, sent via AJAX). Hidden static copies live at the bottom of
`index.html` so Netlify's build bots register them — **don't delete that block.**

One-time setup: in the Netlify dashboard → **Forms → Enable form detection**,
then redeploy. Submissions appear under Forms (100/month on the free tier);
export the list or wire a notification there.

## Auto-updating articles (RSS)

`.github/workflows/rss-cache.yml` runs daily, executes
`scripts/fetch_feeds.py`, and commits `data/feed-cache.json` (which also
triggers a Netlify redeploy). The Articles page shows the "Recent from around
the web" section only when the cache has items.

To activate: replace the `PLACEHOLDER` values in `data/feeds.json` with real
RSS URLs. Until then the workflow runs harmlessly and the section stays hidden.

## Assets

`assets/img/` holds `favicon.svg`, `apple-touch-icon.png`, and `og-image.png`
(social-share card). These are generated brand-colored placeholders — replace
with approved artwork anytime, keeping the same filenames.

## Pre-launch checklist

1. Replace remaining `PLACEHOLDER` values in `data/` (search the folder).
2. Set Google Drive files to "Anyone with the link — Viewer"; use `/copy`
   links for Docs and `/export?format=docx` links for Word export.
3. Add ScreenPal/HeyGen embed URLs and verify captions.
4. Enable Netlify form detection and send a test submission.
5. Put real RSS URLs in `data/feeds.json`; run the workflow manually once
   (Actions → Refresh RSS feed cache → Run workflow).
6. Confirm CTL-credit language in `faq.json` and the instructor bio on About.
7. Replace placeholder artwork in `assets/img/`.
8. Run a Lighthouse pass (target 90+) and a link check.

## Finance guide (SWFA companion)

The `/sessions/ai-in-finance/` section is the migrated companion site for the
Southwestern Finance Association 2026 session ("Top 10 AI Applications for
Finance Classroom Instruction"). Its content lives in the `finance-*.json`
files listed above; the guide's PDFs live in `assets/docs/`. The session is
registered in `sessions.json` as a `"type": "guide"` entry, which makes it
appear on the Sessions hub and homepage strip, and on Module 3/4/5 pages via
`relatedModules`. The original site (garcijo4.github.io/ai_in_finance_classroom)
stays online for SWFA citations and points here via canonical links.
