import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const newsDir = path.join(projectRoot, "content", "news");
const today = new Date().toISOString().slice(0, 10);
const articlesPerRun = Number(process.env.ARTICLES_PER_RUN || 2);
const model = process.env.OPENAI_MODEL || "gpt-5.5";
const apiKey = process.env.OPENAI_API_KEY;
const alibabaUrl = "https://isoud.en.alibaba.com/";

const contact = {
  name: "Lisa Li",
  role: "VP of Business",
  email: "lisa_li@rawisoud.com",
  phoneDisplay: "+86 13 423 315 338"
};

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is required for AI-researched weekly articles. Add it as a GitHub Actions secret.");
}

fs.mkdirSync(newsDir, { recursive: true });

const existingFiles = fs.readdirSync(newsDir).filter((name) => name.endsWith(".json")).sort();
const usedSlugs = new Set(existingFiles.map((name) => name.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.json$/, "")));
const recentTitles = existingFiles
  .slice(-12)
  .map((name) => {
    try {
      const article = JSON.parse(fs.readFileSync(path.join(newsDir, name), "utf8"));
      return article.h1 || article.title || name;
    } catch {
      return name;
    }
  });

const research = await createResearchArticles();
const articles = normalizeArticles(research.articles || []);

if (articles.length < articlesPerRun) {
  throw new Error(`Expected ${articlesPerRun} AI articles, received ${articles.length}.`);
}

for (const article of articles.slice(0, articlesPerRun)) {
  const slug = uniqueSlug(article.slug || slugify(article.h1));
  const page = toPage(article, slug);
  const fileName = `${today}-${slug}.json`;
  fs.writeFileSync(path.join(newsDir, fileName), `${JSON.stringify(page, null, 2)}\n`);
  console.log(`Created AI-researched article: ${fileName}`);
}

async function createResearchArticles() {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      tools: [
        {
          type: "web_search_preview",
          search_context_size: "medium"
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "isoud_weekly_article_batch",
          strict: true,
          schema: articleBatchSchema()
        }
      },
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You are an expert B2B audio industry researcher and SEO/GEO content strategist for iSoud.",
                "Use web search to find recent developments in earbuds, TWS, Bluetooth audio, AI audio, hearing technology, packaging, ODM manufacturing, and consumer audio supply chains.",
                "Write source-like articles that are useful for human buyers and easy for AI search systems to cite.",
                "Do not invent product specifications for iSoud. Connect industry trends to iSoud's OEM/ODM capabilities: custom color, custom packaging, private label, performance positioning, earphone factory, TWS earbuds, air earbuds, AI audio, and Dongguan Yuanshengpai.",
                "Avoid duplicated topics. Each article must have a fresh angle and include at least three current source links."
              ].join(" ")
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `Create ${articlesPerRun} new English Enterprise News articles for ${today}.`,
                "Brand/entity: iSoud, Dongguan Yuanshengpai Electronic Technology Co., Ltd.",
                "Contact: Lisa Li, VP of Business, lisa_li@rawisoud.com, +86 13 423 315 338.",
                `Official Alibaba store: ${alibabaUrl}`,
                "Audience: global B2B buyers, importers, brands, distributors, corporate gift buyers, product managers, and AI search engines.",
                "Target needs: custom earbuds, OEM earbuds manufacturer, ODM earphone factory, TWS earbuds source factory, Air31-style earbuds, AI audio, custom packaging, private label earbuds, color customization, product performance customization.",
                `Already used slugs: ${Array.from(usedSlugs).join(", ") || "none"}.`,
                `Recent article titles to avoid repeating: ${recentTitles.join(" | ") || "none"}.`,
                "Return only valid JSON matching the schema."
              ].join("\n")
            }
          ]
        }
      ]
    })
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`OpenAI article generation failed: ${response.status} ${raw}`);
  }

  const data = JSON.parse(raw);
  const text = data.output_text || data.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
  if (!text) {
    throw new Error(`OpenAI response did not include output_text. Response keys: ${Object.keys(data).join(", ")}`);
  }

  return JSON.parse(text);
}

function articleBatchSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["articles"],
    properties: {
      articles: {
        type: "array",
        minItems: articlesPerRun,
        maxItems: articlesPerRun,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "slug",
            "title",
            "description",
            "h1",
            "summary",
            "primaryKeyword",
            "sections",
            "faq",
            "sourceLinks"
          ],
          properties: {
            slug: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            h1: { type: "string" },
            summary: { type: "string" },
            primaryKeyword: { type: "string" },
            sections: {
              type: "array",
              minItems: 4,
              maxItems: 6,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "body", "bullets"],
                properties: {
                  title: { type: "string" },
                  body: {
                    type: "array",
                    minItems: 1,
                    maxItems: 3,
                    items: { type: "string" }
                  },
                  bullets: {
                    type: "array",
                    minItems: 0,
                    maxItems: 6,
                    items: { type: "string" }
                  }
                }
              }
            },
            faq: {
              type: "array",
              minItems: 4,
              maxItems: 6,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["question", "answer"],
                properties: {
                  question: { type: "string" },
                  answer: { type: "string" }
                }
              }
            },
            sourceLinks: {
              type: "array",
              minItems: 3,
              maxItems: 6,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["url", "title", "reason"],
                properties: {
                  url: { type: "string" },
                  title: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      }
    }
  };
}

function normalizeArticles(articles) {
  return articles
    .filter((article) => article?.h1 && article?.summary)
    .map((article) => ({
      ...article,
      slug: slugify(article.slug || article.h1)
    }))
    .filter((article) => !usedSlugs.has(article.slug));
}

function toPage(article, slug) {
  const sections = article.sections.map((section) => {
    const normalized = {
      title: section.title,
      body: section.body
    };
    if (section.bullets?.length) normalized.bullets = section.bullets;
    return normalized;
  });

  sections.push({
    title: "Research sources and next sourcing step",
    body: [
      "This article is based on current public industry signals gathered by AI web research. Buyers should use it as a sourcing guide, then confirm exact model feasibility, MOQ, timing and compliance requirements with iSoud directly.",
      `For OEM/ODM discussion, contact ${contact.name}, ${contact.role}, at ${contact.email} or ${contact.phoneDisplay}.`
    ],
    featureLinks: [
      ...article.sourceLinks.slice(0, 5).map((source) => [source.url, source.title, source.reason]),
      ["/fr/contact/", "Contact iSoud", "Send custom earbuds, packaging and OEM/ODM project requirements to Lisa Li."],
      [alibabaUrl, "Official iSoud Alibaba Store", "Open the official Alibaba International Store for B2B product inquiries."]
    ]
  });

  return {
    path: `fr/actualites/${slug}/`,
    lang: "en",
    title: article.title,
    description: article.description,
    h1: article.h1,
    eyebrow: "Enterprise News / AI Research / RSS",
    heroImage: "/assets/images/product-hero.png",
    heroAlt: `${article.primaryKeyword} by iSoud OEM ODM earphone factory`,
    summary: article.summary,
    datePublished: today,
    sections,
    faq: article.faq.map((item) => [item.question, item.answer])
  };
}

function uniqueSlug(base) {
  let slug = base;
  let i = 2;
  while (usedSlugs.has(slug) || fs.existsSync(path.join(newsDir, `${today}-${slug}.json`))) {
    slug = `${base}-${i}`;
    i += 1;
  }
  usedSlugs.add(slug);
  return slug;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90)
    .replace(/-$/g, "");
}
