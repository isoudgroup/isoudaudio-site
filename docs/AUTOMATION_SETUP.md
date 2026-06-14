# iSoud weekly RSS automation setup

## Cloudflare Pages Git settings

Use a new Cloudflare Pages project connected to GitHub.

- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

Cloudflare will deploy automatically whenever GitHub receives a new commit.

## Weekly publishing schedule

The GitHub Actions workflow `.github/workflows/publish-weekly-news.yml` runs every Tuesday and Friday at 02:00 UTC, which is 10:00 in China time.

Each run creates two new Enterprise News article JSON files under `content/news/`, rebuilds the site, updates RSS and sitemap, commits the result, and pushes back to GitHub.

## Google Search Console sitemap submission

Automatic sitemap submission is optional. To enable it:

1. Create a Google Cloud service account.
2. Enable the Google Search Console API.
3. Add the service account email as a user/owner in Google Search Console for `isoudaudio.com`.
4. Add these GitHub repository secrets:
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GSC_SITE_URL`

Recommended value for `GSC_SITE_URL`:

```text
sc-domain:isoudaudio.com
```

If the Search Console property is a URL-prefix property instead of a domain property, use:

```text
https://isoudaudio.com/
```

The workflow updates `https://isoudaudio.com/sitemap.xml`. Google still decides if and when each URL is indexed.
