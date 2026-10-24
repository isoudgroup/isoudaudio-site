# Buyer-guide publishing

Create content/news/YYYY-MM-DD-en-topic.json. Use lang en and a new path insights/topic/ for English articles. Keep published historical URLs as they are. Other languages use their actual lang; do not declare independent topics to be translations.

Required fields: path, lang, title, description, h1, summary, datePublished and sections. Each section has title and optional body, bullets, table, cards and featureLinks. A table is an array of row arrays. Links are [href, title, supporting description]. Optional faq is an array of [question, answer]. Use dateModified only after a substantive update and keep datePublished unchanged.

Start with a buyer question and a useful checklist. Link a relevant product or service page plus the corresponding contact page. Verify current technical claims with primary sources. No unsupported product performance or invented factory cases. New writing avoids the old keyword-stuffing patterns and does not imply guaranteed ranking.

Run npm run verify, review the changed page on desktop and mobile, then publish only within the user's authorization. Confirm Cloudflare's deployed revision and the actual live page, RSS and sitemap before reporting success. Submit the published sitemap to Google; report acceptance separately from indexing.
