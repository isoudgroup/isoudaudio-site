import tls from "node:tls";

// Read-only SMTP probe: no authentication, credentials or message submission.
const socket = tls.connect({
  host: "smtp.qiye.aliyun.com",
  port: 465,
  servername: "smtp.qiye.aliyun.com",
  rejectUnauthorized: true
}, () => {
  console.log(JSON.stringify({
    scope: "local-network-only",
    tlsAuthorized: socket.authorized,
    protocol: socket.getProtocol(),
    certificateExpires: socket.getPeerCertificate().valid_to
  }));
});

let stage = "greeting";
let pending = "";
let receivedBytes = 0;
function fail(code) {
  console.error(JSON.stringify({ success: false, error: code }));
  process.exitCode = 1;
  socket.destroy();
}
const timer = setTimeout(() => fail("SMTP_TIMEOUT"), 12000);
socket.on("data", (bytes) => {
  receivedBytes += bytes.length;
  if (receivedBytes > 8192) return fail("SMTP_RESPONSE_TOO_LARGE");
  pending += bytes.toString("utf8");
  let position;
  while ((position = pending.indexOf("\r\n")) >= 0) {
    const line = pending.slice(0, position);
    pending = pending.slice(position + 2);
    console.log(line);
    if (/^[45]\d\d[ -]/.test(line)) return fail("SMTP_REJECTED_PROBE");
    if (stage === "greeting" && /^220 /.test(line)) {
      stage = "ehlo";
      socket.write("EHLO isoudaudio.com\r\n");
    } else if (stage === "ehlo" && /^250 /.test(line)) {
      stage = "quit";
      socket.write("QUIT\r\n");
    } else if (stage === "quit" && /^221 /.test(line)) {
      stage = "complete";
      console.log(JSON.stringify({
        success: true,
        authenticated: false,
        emailSent: false,
        scope: "local-network-only"
      }));
      socket.end();
    }
  }
});
socket.on("error", (error) => fail(error.code || "TLS_CONNECTION_FAILED"));
socket.on("close", () => {
  clearTimeout(timer);
  if (stage !== "complete" && !process.exitCode) {
    console.error(JSON.stringify({ success: false, error: "SMTP_CLOSED_EARLY" }));
    process.exitCode = 1;
  }
});
