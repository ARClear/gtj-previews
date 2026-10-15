# gtj-previews

Temporary review copies of Greater Than Jargon client sites, served by GitHub Pages at
`https://arclear.github.io/gtj-previews/<client-slug>/`.

## Rules
- **Built output only.** The source of truth is each client's own private repo. Copy the
  finished files into `<client-slug>/` here for review.
- **Public by necessity.** Pages sites are publicly reachable, so: no secrets or keys, and
  nothing a client wouldn't want seen before launch.
- **Not indexed.** Every preview page gets `<meta name="robots" content="noindex, nofollow">`;
  root `robots.txt` disallows everything. The root `index.html` never lists clients.
- **Relative links only.** Sites run from a subfolder here, so root-absolute paths
  (`/css/main.css`) break. Use `css/main.css`.
- **Forms:** add `arclear.github.io` to the Turnstile site's allowed hostnames if a form
  needs testing in preview.
- **Remove at launch.** Delete the client's folder once their site is live.

## Add / update a preview
```bash
cp -r "<client repo>/." "<client-slug>/"   # exclude .git and any key files
git add <client-slug> && git commit -m "Preview: <client> <milestone>" && git push
```
Pages redeploys in about a minute.
