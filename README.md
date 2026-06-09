# Teaching with AI Website Wireframe

This folder contains a full clickable, branded wireframe for the Teaching with
Artificial Intelligence faculty-development website. It uses plain HTML, CSS,
vanilla JavaScript, and editable JSON files. There is no build step.

## Published Site

**Direct link:** [https://garcijo4.github.io/teachingwithai/](https://garcijo4.github.io/teachingwithai/)

The site deploys automatically to GitHub Pages whenever changes are pushed to
the `main` branch.

## Preview Locally

From the `website` folder, start any static web server. Python is one simple
option:

```powershell
python -m http.server 8080
```

Then open `http://127.0.0.1:8080/`.

Do not open the HTML files directly with `file://`. The pages fetch JSON content
and require a local or hosted web server.

## Content Editing

The editable content layer lives in `data/`:

- `modules.json`: module names, objectives, videos, worksheets, and artifacts
- `key-terms.json`: glossary definitions and video scripts
- `articles.json`: curated article cards
- `chatbots.json`: faculty-support chatbot directory
- `quickstart.json`: time-based quick-start paths
- `faq.json`: faculty FAQ entries
- `updates.json`: newsletter archive
- `site.json`: shared site details and contact information
- `feeds.json`: future RSS feed configuration

Search the website folder for `PLACEHOLDER` before launch. Replace those values
with approved ScreenPal, HeyGen, Google Drive, chatbot, support, article, RSS,
domain, and instructor-bio details.

## Wireframe Behavior

- Course and module content is rendered from JSON.
- Module items and portfolio artifacts save progress to browser `localStorage`.
- Key terms and articles have working client-side filters.
- Video placeholders demonstrate the intended click-to-load behavior.
- Subscribe and feedback forms use Netlify-compatible markup, but submission is
  intentionally disabled while this remains a wireframe.
- External placeholder links are intercepted so the wireframe never navigates
  to an invented URL.

## Before Production

1. Replace every `PLACEHOLDER`.
2. Set all Google Drive resources to "Anyone with the link - Viewer."
3. Use `/copy` links for editable Google Docs and add Word/PDF export links.
4. Add final ScreenPal and HeyGen embed URLs and verify captions.
5. Connect and test Netlify Forms.
6. Confirm support, contact, privacy, analytics, and CTL-credit language.
7. Add approved instructor artwork, favicon, and social-sharing image.
8. Run accessibility, responsive, link, and performance checks.
