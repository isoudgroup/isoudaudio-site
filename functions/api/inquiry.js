const RECIPIENT = "lisa_li@rawisoud.com";
const SENDER = "inquiry@isoudaudio.com";
const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/vcard",
  "text/x-vcard"
]);

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function clean(value, max = 4000) {
  return String(value || "").trim().slice(0, max);
}

function escapeHtml(value) {
  return clean(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 160;
}

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  try {
    const hostname = new URL(origin).hostname;
    return hostname === "isoudaudio.com" ||
      hostname === "www.isoudaudio.com" ||
      hostname === "isoudaudio-site.pages.dev" ||
      hostname.endsWith(".isoudaudio-site.pages.dev");
  } catch {
    return false;
  }
}

function bytesToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function valueList(form, name) {
  return form.getAll(name).map((value) => clean(value, 120)).filter(Boolean);
}

function fieldRows(fields) {
  return Object.entries(fields)
    .map(([label, value]) => `<tr><th style="padding:8px 12px;text-align:left;background:#f3f4f5;border-bottom:1px solid #ddd">${escapeHtml(label)}</th><td style="padding:8px 12px;border-bottom:1px solid #ddd">${escapeHtml(value || "Not provided")}</td></tr>`)
    .join("");
}

export async function onRequestGet(context) {
  return json({ available: Boolean(context.env.INQUIRY_EMAIL) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!sameOrigin(request)) return json({ success: false, error: "Invalid request origin" }, 403);
  if (!request.headers.get("Content-Type")?.includes("multipart/form-data")) {
    return json({ success: false, error: "Expected multipart form data" }, 415);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ success: false, error: "The inquiry form could not be read" }, 400);
  }

  if (clean(form.get("website"), 200)) return json({ success: true });

  const elapsed = Date.now() - Number(form.get("startedAt"));
  if (!Number.isFinite(elapsed) || elapsed < 1500 || elapsed > 24 * 60 * 60 * 1000) {
    return json({ success: false, error: "Please reload the form and try again" }, 400);
  }

  const fields = {
    Name: clean(form.get("name"), 100),
    Company: clean(form.get("company"), 140),
    "Work email": clean(form.get("email"), 160),
    "Phone / WhatsApp": clean(form.get("phone"), 80),
    "Country / region": clean(form.get("country"), 100),
    "Target market": clean(form.get("market"), 140),
    "Product category": clean(form.get("product"), 120),
    "Project type": clean(form.get("projectType"), 120),
    "Estimated quantity": clean(form.get("quantity"), 80),
    "Target launch": clean(form.get("timeline"), 40),
    Customization: valueList(form, "customization").join(", ")
  };
  const subject = clean(form.get("subject"), 140) || "OEM/ODM earbuds project inquiry";
  const message = clean(form.get("message"), 4000);

  if (!fields.Name || !fields.Company || !fields["Work email"] || !fields["Country / region"] || !fields["Product category"] || !fields["Project type"] || !fields["Estimated quantity"] || !message) {
    return json({ success: false, error: "Please complete all required fields" }, 400);
  }
  if (!validEmail(fields["Work email"])) return json({ success: false, error: "Please enter a valid work email" }, 400);
  if (form.get("consent") !== "on") return json({ success: false, error: "Consent is required" }, 400);

  const attachments = [];
  const attachment = form.get("attachment");
  if (attachment && typeof attachment.arrayBuffer === "function" && attachment.size > 0) {
    if (attachment.size > MAX_ATTACHMENT_BYTES) return json({ success: false, error: "Attachment must be 3 MB or smaller" }, 413);
    if (!ALLOWED_ATTACHMENT_TYPES.has(attachment.type)) return json({ success: false, error: "Unsupported attachment type" }, 415);
    attachments.push({
      content: bytesToBase64(await attachment.arrayBuffer()),
      filename: clean(attachment.name, 120).replace(/[^a-zA-Z0-9._ -]/g, "_") || "attachment",
      type: attachment.type,
      disposition: "attachment"
    });
  }

  if (!env.INQUIRY_EMAIL) {
    return json({ success: false, fallback: "mailto", error: "Web email binding is not configured" }, 503);
  }

  const plainText = [
    "New iSoud website OEM/ODM inquiry",
    "",
    ...Object.entries(fields).map(([label, value]) => `${label}: ${value || "Not provided"}`),
    "",
    "Project message:",
    message
  ].join("\n");

  const html = `<div style="font-family:Arial,sans-serif;color:#181818;max-width:760px">
    <div style="padding:18px 22px;background:#24272b;color:white;border-top:5px solid #ed1c24">
      <h1 style="margin:0;font-size:22px">New iSoud OEM/ODM inquiry</h1>
      <p style="margin:6px 0 0;color:#d6d9dd">Submitted through isoudaudio.com</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin:22px 0">${fieldRows(fields)}</table>
    <div style="padding:18px 20px;background:#f3f4f5;border-left:4px solid #ed1c24">
      <strong>Project message</strong>
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    </div>
  </div>`;

  try {
    const result = await env.INQUIRY_EMAIL.send({
      to: { email: RECIPIENT, name: "Lisa Li" },
      from: { email: SENDER, name: "iSoud Website Inquiry" },
      replyTo: { email: fields["Work email"], name: fields.Name },
      subject: `[iSoud Inquiry] ${subject}`,
      text: plainText,
      html,
      attachments
    });
    return json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error("Inquiry email failed", error?.code, error?.message);
    return json({ success: false, fallback: "mailto", error: "Email delivery is temporarily unavailable" }, 502);
  }
}
