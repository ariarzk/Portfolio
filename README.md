# Aria Rizki Ermawan — portfolio

Static site. No framework, no build step, no dependencies: HTML, three
stylesheets and two small scripts. Open `index.html` in a browser and it
works; put the folder on any static host and it works there too.

## Pages

| Path | What it is |
|---|---|
| `index.html` | Profile — positioning, practice, track record |
| `work/index.html` | Selected Work — Manufacture Terminal featured, three engagements behind it |
| `work/<slug>/index.html` | The four case studies (BT-01 … BT-04) |
| `skills/index.html` | Skills & Capabilities — the knowledge graph |
| `contact/index.html` | Contact |
| `404.html` | Served by GitHub Pages for unknown paths |

Every link in the site is relative, so it runs correctly at a domain root
(`username.github.io`) **or** in a subfolder (`username.github.io/repo/`).

## Shared files

```
emw/tokens.css      EMW design-system token layer — copied verbatim, do not patch
emw/ds-bundle.css   EMW base, type scale and components — copied verbatim
emw/portfolio.css   styles written for this site, on the tokens
emw/portfolio.js    theme toggle and the editorial reveal, shared by every page
```

To take a design-system update, re-copy the first two from the EMW
`ds-bundle`. Nothing in them is modified here, which is what makes that safe.

## Editing

- **Case content** — edit the page itself; each file opens with a comment
  saying where its content came from and what is redacted.
- **The knowledge graph** — edit `skills/graph-data.js` only. Nodes,
  clusters, syntheses, edges and layout all live there; `skills/graph.js`
  draws whatever it finds, and rebuilds the small-screen index from the same
  model.
- **Theme** — `data-theme="dark"` (Terminal) or `"light"` (Paper) on `<html>`;
  the toggle in the masthead persists the visitor's choice.
- **The masthead** is duplicated per page because there is no build step.
  Change one, change all.

## Publishing to GitHub Pages

Either route works — the repository must be **public** for Pages on a free
account.

**With git**

```bash
git init
git add .
git commit -m "Portfolio"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

**Without git** — create the repository on github.com, choose *uploading an
existing file*, and drag the contents of this folder in. Note that Finder
hides dotfiles: `.nojekyll` and `.gitignore` may not come along. Nothing
breaks if `.nojekyll` is missing — it is only insurance against Jekyll
ignoring folders that begin with an underscore, and this site has none.

Then: **Settings → Pages → Source: Deploy from a branch → `main` / `root`**.
The site appears at `https://<username>.github.io/<repo>/` within a minute or
two. For `https://<username>.github.io/` instead, name the repository
`<username>.github.io`.

A custom domain later: add a `CNAME` file containing the domain, and point a
DNS record at GitHub.

## Before it goes public

This repository is the published site. Everything in it is visible, including
the case studies, so the redaction already applied to them is load-bearing:

- No absolute currency values anywhere — capital costs, facilities, net
  present value and cost tables are ratios and variances only.
- No names or signatures other than the author's, and no document references.
- No process parameters from the LAPI ITB assessment, and no product
  parameters found outside threshold.
- Figures shown in the Manufacture Terminal screenshots are synthetic, from
  the demonstration build.

If a future edit adds a real figure, check it against that list first.

© Aria Rizki Ermawan. Built on the EMW design system.
