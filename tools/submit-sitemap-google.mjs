const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const siteUrl = process.env.GSC_SITE_URL || "sc-domain:isoudaudio.com";
const sitemapUrl = process.env.SITEMAP_URL || "https://isoudaudio.com/sitemap.xml";

if (!clientEmail || !privateKey) {
  console.log("Google Search Console secrets are not configured. Skipping sitemap API submission.");
  process.exit(0);
}

const { createSign } = await import("node:crypto");

const token = await getAccessToken();
const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
const response = await fetch(endpoint, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`
  }
});

if (!response.ok) {
  const text = await response.text();
  throw new Error(`Google sitemap submission failed: ${response.status} ${text}`);
}

console.log(`Submitted sitemap to Google Search Console: ${sitemapUrl}`);

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/webmasters",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  });

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google OAuth token request failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.access_token;
}

function signJwt(claims) {
  const header = { alg: "RS256", typ: "JWT" };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  return `${unsigned}.${signer.sign(privateKey, "base64url")}`;
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}
