# Robert Hickey - personal site

A small, fast, dependency-free personal website and CV, hosted on GitHub Pages.
Plain HTML and CSS with a sprinkle of vanilla JavaScript. No build step, no
framework, nothing to break: edit a file, push, and it is live.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole site (hero, about, experience, skills, education, certifications, contact). |
| `styles.css` | All styling, including light/dark themes and print styles. |
| `script.js` | Theme toggle (saved in `localStorage`) and the footer year. |
| `404.html` | Friendly not-found page. |
| `assets/favicon.svg` | Site icon (an "RH" monogram). |
| `.nojekyll` | Tells GitHub Pages to serve files as-is (skip Jekyll). |

## Editing content

Open `index.html` and edit the text directly. A few notes:

- The **Interests & Projects** section is commented out near the bottom. Fill it
  in and remove the comment markers to show it.
- Your **phone number is intentionally not on the site** for privacy. Add it to
  the Contact section if you want it public.
- To switch the default color theme, change `data-theme="light"` to
  `data-theme="dark"` on the opening `<html>` tag.

## Local preview

Just open `index.html` in a browser. For a closer match to production (so paths
resolve cleanly) you can run a tiny local server from this folder:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## How it deploys

This repo is published with **GitHub Pages**. Because the repository is named
`rfhickey.github.io`, it serves at the root URL:

> https://rfhickey.github.io/

Every push to the `main` branch publishes automatically within a minute or two.
Pages source is set to **Deploy from a branch -> main -> / (root)**.

### Optional: custom domain

To use a domain like `roberthickey.com`, add a `CNAME` file containing the
domain, point the domain's DNS at GitHub Pages, and set the custom domain in the
repo's **Settings -> Pages**.
