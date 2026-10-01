# Article content model

One JSON file per article in `content/articles/<slug>.json`. Files starting
with `_` are ignored. After editing, run `node scripts/build-articles.mjs`,
then `node scripts/verify-site.mjs`, and commit the generated files.

| Field | Type | Required | Notes |
|---|---|---|---|
| `slug` | string | yes | Lowercase letters, digits, hyphens. Must equal the file name. Becomes `/articles/<slug>/`. Never change it after publishing. |
| `title` | string | yes | Used as the H1. |
| `description` | string | yes | Meta description (aim for 120–160 characters). |
| `category` | string | yes | A `slug` from `content/categories.json`. |
| `datePublished` | `YYYY-MM-DD` | yes | |
| `dateModified` | `YYYY-MM-DD` | yes | Not earlier than `datePublished`. Shown as "Updated" only when different. |
| `author` | string | yes | e.g. `Bizora Team`. |
| `lang` | `en` \| `fr` | yes | Only `en` can be published for now. No French pages and no `hreflang` exist yet. |
| `status` | `draft` \| `published` | yes | Only `published` articles get a page, appear in the index/category pages/sitemap, or can be linked. |
| `featuredImage` | object \| null | no | `{ "src": "/assets/images/x.webp", "alt": "...", "width": 1200, "height": 630 }`. WebP, sized, small. |
| `content` | HTML string | published only | Article body (headings from `<h2>` down; the H1 is the title). If absent, `content/articles/<slug>.html` is used. Must not be empty when published. |
| `relatedArticles` | string[] | no | Slugs of other **published** articles. If empty, up to 3 from the same category are shown. |
| `faq` | `{question, answer}[]` | no | Plain text only. Shown on the page and, only then, emitted as FAQPage JSON-LD. |
| `seo` | object | no | Optional overrides: `metaTitle`, `metaDescription`, `canonical`, `ogTitle`, `ogDescription`, `ogImage`. `canonical` must be `https://www.bizora-cm.com/articles/<slug>/`. |

Rules: body text must be in the HTML (no JavaScript dependence), do not use the
classes `section` or `feature-card` in article content, and use descriptive
link text (never "click here").

Changing any JSON-LD changes its CSP hash; the generator recomputes the hashes
in `netlify.toml` automatically.
