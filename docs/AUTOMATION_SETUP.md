# Maintenance and deployment

Primary project: /Users/jackmini/Desktop/isoudaudio/site. Follow AGENTS.md, docs/LEAD_GENERATION_PLAN.md and ../tasks/WEEKLY_TASK.md.

The existing Codex maintenance schedule is managed in the app. This release changes the website and accompanying instructions; it does not change the schedule. English is now primary. Use researched buyer content, not paid API generation or bulk article templates.

Cloudflare Pages builds GitHub isoudgroup/isoudaudio-site main using npm run build, output dist. functions/api/inquiry.js is the Pages endpoint. A compatible production mail adapter remains necessary; explicit email and Alibaba routes remain available if it is absent.

The existing Submit sitemap to Google workflow uses GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY and GSC_SITE_URL stored as GitHub Secrets. A fixed wait is not proof of deployment completion; independently verify the production revision before reporting release success. GSC Wizard may submit the published sitemap directly through the user's connected account.

Full check: npm run verify. Do not upload dist as a second manually maintained source tree. Source materials, audit statistics and credentials must not be included in static public assets.
