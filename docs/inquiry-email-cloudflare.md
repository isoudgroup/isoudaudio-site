# iSoud inquiry form email setup

The website uses one inquiry route:

- Project buttons: `https://isoudaudio.com/fr/contact/#inquiry`
- Direct email fallback: `mailto:lisa_li@rawisoud.com`
- Form endpoint: `POST /api/inquiry`
- Cloudflare Pages binding name: `INQUIRY_EMAIL`
- Fixed recipient: `lisa_li@rawisoud.com`
- Sender: `inquiry@isoudaudio.com`
- Maximum attachment: 3 MB

## Current behavior

The Pages Function is already implemented. When `INQUIRY_EMAIL` is available, it sends the structured inquiry and optional business-card attachment to Lisa Li. When the binding is unavailable, the browser opens a prefilled email and preserves the form details in the email body.

## One-time Cloudflare setup

1. Sign in to Cloudflare and open **Compute & AI > Email Service**.
2. Onboard `isoudaudio.com` for outbound email and verify `inquiry@isoudaudio.com` as an allowed sender.
3. Add the exact SPF and DKIM records shown by Cloudflare.
4. Keep the existing Aliyun enterprise-mail MX records. Do not replace `mx1.qiye.aliyun.com`, `mx2.qiye.aliyun.com`, or `mx3.qiye.aliyun.com`.
5. Keep only one SPF record. Merge Cloudflare's required sender mechanism with the existing `include:spf.qiye.aliyun.com` record instead of publishing two separate `v=spf1` records.
6. Open **Workers & Pages > isoudaudio-site > Settings > Bindings** and add a Send Email binding named `INQUIRY_EMAIL`.
7. Restrict the destination to `lisa_li@rawisoud.com` and the sender to `inquiry@isoudaudio.com` when the controls are available.
8. Redeploy the latest Pages deployment so the binding becomes available to the Function.
9. Check `GET https://isoudaudio.com/api/inquiry`; the expected response is `{"available":true}`.
10. Submit one controlled test inquiry without an attachment, then one with a small business-card image. Confirm receipt in Lisa Li's inbox and test replying to the buyer address.

## Safety rules

- Never place an API token or mailbox password in the repository.
- Do not change the public recipient without updating both the form copy and `functions/api/inquiry.js`.
- Do not raise the attachment limit beyond 3 MB; Cloudflare's total email-size limit includes base64 overhead and message content.
- Keep the same-origin check and honeypot field enabled.
- Do not add a second contact page. All site project CTAs must continue to point to `/fr/contact/#inquiry`.
