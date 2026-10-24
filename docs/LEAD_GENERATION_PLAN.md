# iSoud lead generation and content plan

Updated 2026-10-24. This plan replaces the old French-first and volume-based plan.

English is primary. French, Spanish, Portuguese, Russian, Arabic and Chinese are real corresponding core/product pages. Preserve historical article URLs and dates. Arabic uses RTL; do not invent hreflang translations for unrelated articles.

Serve independent audio, sports and lifestyle brands in Europe, North America and Australia. Prioritize technical development, clear sample approval and manufacturing coordination. The preferred project profile is 1,000–5,000 units/model/order. USD30–100 is an audience target, not verified pricing for every catalogue model.

Priorities: (1) reliable contact and explicit email fallback, (2) verified model evidence and sample criteria, (3) buyer-useful content and relevant internal links, (4) measured search performance and qualified inquiries. Service acceptance, actual receipt and qualified leads are different outcomes.

The four homepage directions are SY-T7, G1, M162 and HK03. Exact availability, specifications, customization and manufacturing scope must be confirmed. No unverified battery, protection, medical, certification, ownership or customer-case claims.

New editorial work is English-first: improve existing content when it already meets the intent. New articles should answer a buyer decision, offer a useful checklist, link relevant product/service pages and provide a contact action. Other languages require real localization. Do not mechanically publish near-duplicate pages or enable paid generation.

Use content/news JSON for new articles, content/site/products.mjs for platforms and web/ for shared presentation. Existing articles in tools/legacy-content.mjs remain to preserve URLs. Article dates remain page-specific; a build never refreshes every historical date.

Run npm run verify before release. Production uses GitHub isoudgroup/isoudaudio-site main, Cloudflare Pages npm run build and output dist. Check the actual deployed revision before sitemap submission. Sitemap API acceptance is not Google indexing or ranking.

Operations, source-material provenance and release logs are maintained in the parent isoudaudio folder. No schedule or account/DNS changes without user authorization for those changes.
