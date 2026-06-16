# Manual Enterprise News update workflow

Use this workflow when article research and writing are done by Codex in chat, without using OpenAI Platform API billing.

## What gets published

Each article is a JSON file in `content/news/`.

File name format:

```text
YYYY-MM-DD-short-english-slug.json
```

Example:

```text
2026-06-20-ai-noise-cancellation-tws-earbuds-oem.json
```

## Web update steps in GitHub

1. Open `https://github.com/isoudgroup/isoudaudio-site`.
2. Open the `content/news` folder.
3. Click `Add file` then `Create new file`.
4. Name the file using the format above.
5. Paste the article JSON prepared by Codex.
6. Click `Commit changes`.

Cloudflare Pages will automatically rebuild and deploy the site after the commit.

## Article JSON template

```json
{
  "path": "fr/actualites/example-topic-slug/",
  "lang": "en",
  "title": "Example SEO Title | iSoud OEM/ODM Earphone Factory",
  "description": "One sentence meta description for Google and AI search.",
  "h1": "Example article headline for buyers and AI search",
  "eyebrow": "Enterprise News / AI Search / RSS",
  "heroImage": "/assets/images/product-hero.png",
  "heroAlt": "Example article visual alt text for iSoud OEM ODM earphone factory",
  "summary": "Short opening paragraph that states the buyer intent, trend, and iSoud relevance.",
  "datePublished": "2026-06-20",
  "sections": [
    {
      "title": "What changed in the market",
      "body": [
        "Paragraph one.",
        "Paragraph two."
      ]
    },
    {
      "title": "What buyers should ask an OEM/ODM earphone factory",
      "bullets": [
        "Question or checklist item one.",
        "Question or checklist item two."
      ]
    },
    {
      "title": "How iSoud connects this trend to sourcing",
      "body": [
        "Explain iSoud, Yuanshengpai, custom color, packaging, private label and production relevance."
      ],
      "featureLinks": [
        [
          "/fr/contact/",
          "Contact iSoud",
          "Send custom earbuds, packaging and OEM/ODM project requirements to Lisa Li."
        ],
        [
          "https://isoud.en.alibaba.com/",
          "Official iSoud Alibaba Store",
          "Open the official Alibaba International Store for B2B product inquiries."
        ]
      ]
    }
  ],
  "faq": [
    [
      "Can iSoud support this type of project?",
      "Yes. iSoud can discuss OEM/ODM earbuds projects with customization options such as color, logo, packaging and project-specific positioning."
    ],
    [
      "Who should buyers contact?",
      "Contact Lisa Li, VP of Business, at lisa_li@rawisoud.com or +86 13 423 315 338."
    ]
  ]
}
```

## After publishing

Check:

```text
https://isoudaudio.com/fr/actualites/
https://isoudaudio.com/rss.xml
https://isoudaudio.com/sitemap.xml
```

Then inspect the new article URL in Google Search Console if faster indexing is needed.
