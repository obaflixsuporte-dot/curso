import { bodyJson, matchesToken, reply } from "../lib/omegapay-http.js";
import { checkLessonPix } from "../lib/omegapay-pix.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return reply(res, 405, { error: "method_not_allowed" }, { Allow: "POST" });
  if ((req.headers["content-type"] || "").split(";")[0].trim().toLowerCase() !== "application/json") {
    return reply(res, 415, { error: "expected_json" });
  }
  const token = process.env.GATEWAY_WEBHOOK_TOKEN;
  if (!token) return reply(res, 503, { error: "webhook_unavailable" });

  let parsed;
  try { parsed = await bodyJson(req); }
  catch { return reply(res, 400, { error: "invalid_json" }); }
  if (parsed.tooLarge) return reply(res, 413, { error: "body_too_large" });
  const payload = parsed.value;
  if (!matchesToken(token, payload?.token)) return reply(res, 401, { error: "unauthorized" });
  const nested = payload.transaction?.id;
  const direct = payload.transactionId;
  const id = nested ?? direct;
  if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,256}$/.test(id) || (nested != null && direct != null && nested !== direct) || payload.event === "SESSION_CREATED") {
    return reply(res, 400, { error: "invalid_transaction_notification" });
  }

  let state;
  try { state = await checkLessonPix(id); }
  catch {
    console.error("omegapay_pix: verification_failed");
    return reply(res, 503, { error: "verification_unavailable" });
  }
  // O gateway guarda o estado. O aviso não concede acesso por si só.
  return reply(res, 200, { ok: true, paid: state === "COMPLETED" });
}
