# Robert Hickey - personal site (neon edition)

A cinematic Matrix-green personal CV site: parallax neon data artwork, a
backlit portrait, neon glass panels, and glowing headline numbers. Plain HTML, CSS,
and vanilla JavaScript. No build step, no framework, no external requests:
edit a file, push, and it is live.

With JavaScript disabled the page is still a complete, readable resume; every
metric value is baked into the HTML and the scripts only decorate.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole site (hero, numbers, experience, skills, education, story, contact). |
| `styles.css` | All styling: neon theme, recruiter mode, reduced motion, and print styles. |
| `script.js` | All interactivity (see below). Progressive enhancement only. |
| `404.html` | Not-found page styled to match. |
| `assets/portrait.jpg` | Hero photo, also the og:image for social previews. |
| `assets/favicon.png` / `assets/apple-touch-icon.png` | Site icons (the portrait photo). |
| `assets/favicon.svg` | Old "RH" monogram icon, kept but no longer referenced. |
| `.nojekyll` | Tells GitHub Pages to serve files as-is (skip Jekyll). |

## Interactive features

- **Parallax data artwork**: neon wireframe scenes (a table lineage graph, a
  dashboard, a trend chart, schema tables with a scatter plot) drift behind
  the content at different speeds as you scroll. Static and simplified under
  reduced motion or without JS.
- **Backlit portrait**: circular photo with a green neon halo and glow.
- **Pointer glow**: a soft green light follows the cursor (desktop only).
- **Scroll reveals**: panels fade up as they enter the viewport (JS + motion
  permitting; content is never hidden without both).
- **Glowing numbers**: headline metrics count up when scrolled into view;
  final values are baked into the HTML.
- **Skill cross-filter**: tap a skill chip to highlight every experience
  bullet that proves it. Esc clears.
- **Console easter egg**: press `/` (or the `$_` footer button). Whitelisted
  commands: `help`, `ls`, `whoami`, `contact`, `clear`, `sudo hire robert`,
  and a mini SQL dialect over the resume data.
- **Deep links for outreach**: `/?skill=snowflake` lands with the resume
  pre-filtered to that skill; `/?q=<urlencoded query>` opens the console and
  runs the query. Malformed params are ignored. Use these in cover letters.
- **Recruiter mode**: header toggle that swaps to a high-legibility light
  theme and kills all effects, persisted in `localStorage`.
- **Print**: the "Save as PDF" button (or Ctrl+P) produces a clean
  black-on-white one-to-two page resume with link URLs printed.

## Editing content

Open `index.html` and edit the text directly. Notes:

- The **phone number is intentionally not on the site** for privacy.
- The experience bullets carry `data-skills="..."` tokens that power the skill
  cross-filter; keep them in sync when editing bullets.
- The console's resume data lives in a small literal in `script.js`; update it
  if facts change.
- Copy style: no em or en dashes anywhere; commas, colons, parentheses.

## Local preview

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## How it deploys

Published with **GitHub Pages**. Because the repository is named
`rfhickey.github.io`, it serves at the root URL:

> https://rfhickey.github.io/

Every push to `main` publishes automatically within a minute or two. Pages
source: **Deploy from a branch -> main -> / (root)**.

### Optional: custom domain

To use a domain like `roberthickey.com`, add a `CNAME` file containing the
domain, point the domain's DNS at GitHub Pages, and set the custom domain in
the repo's **Settings -> Pages**.
