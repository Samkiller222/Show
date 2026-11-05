# Hosting on Cloudflare Pages

The site is plain HTML, CSS and JS with no build step, so Cloudflare Pages serves the repo as it is. Cloudflare watches GitHub: every push or merged pull request on `main` goes live in about a minute, and every other branch gets its own preview link.

## One-time setup (Cloudflare dashboard)

1. Go to **Workers & Pages → Create → Pages → Connect to Git**. (If you only see a Workers screen, look for the small "Looking to deploy Pages? Get started" link.)
2. Sign in to GitHub when asked and allow Cloudflare to see the `Samkiller222/Show` repository.
3. Pick `Show` and set:
   - Project name: anything, for example `mncf-show`
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: leave empty
   - Build output directory: `/` (the repo root)
4. Click **Save and Deploy**. The site appears at `https://<project-name>.pages.dev`.
5. In the Pages project open **Custom domains → Set up a custom domain**, type your domain (and `www.` too if you want it), and confirm. Because the domain is already on Cloudflare, it adds the DNS record and the HTTPS certificate for you. It can take a few minutes to go green.

## After the domain works

- **Revolut payments (PR #16):** add the Supabase secret `SITE_URL` = `https://<your-domain>/`, so Revolut sends payers back to the new address instead of GitHub Pages.
- **Supabase sign-in:** the site signs in with email and password, so nothing has to change. If email links (password reset, invites) are added later, set Authentication → URL Configuration → Site URL to the new domain.
- **GitHub Pages:** it can stay on as a backup, or be switched off in the repo's Settings → Pages once the new domain is in use.
