# iSoud weekly RSS automation setup

## Cloudflare Pages Git settings

Use a new Cloudflare Pages project connected to GitHub.

- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

Cloudflare will deploy automatically whenever GitHub receives a new commit.

## Manual publishing mode

The site is currently set up for manual AI-assisted publishing instead of paid OpenAI Platform automation.

Recommended weekly workflow:

1. Ask Codex to research current earbud, TWS, AI audio, Bluetooth, packaging or OEM/ODM manufacturing trends.
2. Codex writes two iSoud Enterprise News article JSON files under `content/news/`.
3. Commit and push the files to GitHub.
4. Cloudflare Pages automatically rebuilds and deploys the site.
5. The updated `rss.xml` and `sitemap.xml` are generated during the build.

The GitHub Actions workflow `.github/workflows/publish-weekly-news.yml` is kept as a manual-only workflow. It is not scheduled because OpenAI Platform quota is not enabled.

If OpenAI Platform billing is enabled later, the workflow can be run manually to create two AI-researched Enterprise News article JSON files under `content/news/`, rebuild the site, update RSS and sitemap, commit the result, and push back to GitHub.

## OpenAI AI research setup

The workflow requires one GitHub repository secret:

- `OPENAI_API_KEY`

Optional:

- `OPENAI_MODEL`, default `gpt-5.5`

The AI article generator uses the OpenAI Responses API with web search to collect current public information about earbuds, TWS, Bluetooth audio, AI audio, hearing technology, ODM manufacturing, packaging and supply-chain topics. It then turns those findings into iSoud Enterprise News pages for AI-search/GEO coverage.

If `OPENAI_API_KEY` is missing, the weekly workflow fails on purpose instead of publishing template-only content.

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
