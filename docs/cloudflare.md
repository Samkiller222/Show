# Hosting on Cloudflare Pages

The site is plain HTML, CSS and JS with no build step, so Cloudflare Pages serves the repo as it is. Cloudflare watches GitHub: every push or merged pull request on `main` goes live in about a minute, and every other branch gets its own preview link.

## One-time setup (Cloudflare dashboard)

`wrangler.jsonc` tells Cloudflare to serve the repo folder as a static site, and `.assetsignore` keeps notes, SQL and git data off the website.

1. Go to **Workers & Pages → Create → Import a repository**, sign in to GitHub and pick `Samkiller222/Show`.
2. Project name: `show` (it must match `name` in `wrangler.jsonc`). Build command: leave empty. Deploy command: `npx wrangler deploy`. Leave **Protect with Cloudflare Access** off, because the site has its own sign-in and payers must reach it.
3. Click **Deploy**. The site appears at `https://show.<your-account>.workers.dev`.
4. In the Worker open **Settings → Domains & Routes → Add → Custom domain**, type your domain (and `www.` too if you want it). Cloudflare adds the DNS record and HTTPS certificate.

Cloudflare drops `.html` from addresses (`awards.html` becomes `/awards`). Relative links and `?show=` query strings still work.

## After the domain works

- **Revolut payments (PR #16):** add the Supabase secret `SITE_URL` = `https://<your-domain>/`, so Revolut sends payers back to the new address instead of GitHub Pages.
- **Supabase sign-in:** the site signs in with email and password, so nothing has to change. If email links (password reset, invites) are added later, set Authentication → URL Configuration → Site URL to the new domain.
- **GitHub Pages:** it can stay on as a backup, or be switched off in the repo's Settings → Pages once the new domain is in use.
