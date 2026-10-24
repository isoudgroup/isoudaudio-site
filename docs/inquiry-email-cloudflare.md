# Inquiry delivery: current contract and release gate

Updated 2026-10-24 for the local redesign. This document supersedes the older French-only contact and automatic-mailto instructions.

- English contact: `/contact/`; six additional languages have their own translated contact page.
- Product CTA: `/contact/?product=MODEL`, with the corresponding language prefix.
- Endpoint: `POST /api/inquiry`, multipart form data.
- Fixed recipient: `lisa_li@rawisoud.com`. Sender in the current adapter contract: `inquiry@isoudaudio.com`.
- The browser never automatically opens or sends an email. An explicit email link opens the visitor's application with the brief; this is not a submitted web inquiry.
- The local review server never sends mail. It returns `available:false` for the API status endpoint and 503 for POST.

## Unresolved production integration

The endpoint expects `env.INQUIRY_EMAIL.send(message)` to resolve on service acceptance and reject on failure. It sends a structured object with `to`, `from`, `replyTo`, `subject`, `text`, `html` and optional attachments. A configured variable or `available:true` does not prove an adapter is compatible or that Lisa received a message.

The [current Cloudflare Email Sending Workers API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/) documents this structured message shape. This does not prove the present Pages project exposes the binding, or that this account's sender, destination, subscription and runtime are ready. A generic Service binding alone does not establish this RPC contract.

The user's existing Aliyun-mailbox route remains the previously selected option. See [inquiry-email-aliyun.md](inquiry-email-aliyun.md) for the prior checks. No mail plan, MX records, DNS, credentials or provider were changed during this redesign audit. An actual compatible adapter and environment validation remain to be completed.

## Verified locally

Only name and valid email are required. The handler validates HTTPS origins, form timing and the honeypot, caps the whole request at 4 MiB before multipart parsing, limits an attachment to 3 MiB, escapes HTML, fixes the recipient, and avoids logging buyer details. Eleven isolated tests use fake adapters and do not send real mail.

The visible redesign form currently has no attachment upload field; backend attachment support does not imply that the UI offers uploads. First-party session storage retains only entry path, referring host and validated campaign tags. Form entries are never stored there. The seven privacy pages disclose this behavior.

## Before launch

1. Validate the selected adapter in the actual Cloudflare environment and verify the sender account/domain.
2. When authorized, submit one clearly marked test inquiry and verify service acceptance, Lisa's actual receipt and Reply-To separately.
3. Verify failure behavior and retained entries in production; verify any attachment flow only if an upload field is added.
4. Review account-level abuse/rate controls. Client timing and a honeypot are not a complete anti-abuse service.

No live test message was sent during this audit.
