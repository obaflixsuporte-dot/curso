import { createHash, timingSafeEqual } from "node:crypto";

const LIMIT = 32 * 1024;
const digest = value => createHash("sha256").update(value, "utf8").digest();

export function matchesToken(expected, supplied) {
  return typeof supplied === "string" && supplied.length > 0 && supplied.length <= 4096 &&
    timingSafeEqual(digest(expected), digest(supplied));
}

export function reply(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  res.end(JSON.stringify(body));
}

export async function bodyJson(req) {
  if (Number(req.headers["content-length"]) > LIMIT) return { tooLarge: true };
  let body = req.body;
  if (body === undefined) {
    const chunks = [];
    let size = 0;
    const stream = req.iterator ? req.iterator({ destroyOnReturn: false }) : req;
    for await (const chunk of stream) {
      const part = Buffer.from(chunk);
      size += part.length;
      if (size > LIMIT) return { tooLarge: true };
      chunks.push(part);
    }
    body = Buffer.concat(chunks, size);
  }
  if (typeof body === "string" || Buffer.isBuffer(body)) {
    if (Buffer.byteLength(body) > LIMIT) return { tooLarge: true };
    return { value: JSON.parse(body.toString()) };
  }
  return Buffer.byteLength(JSON.stringify(body) ?? "") > LIMIT ? { tooLarge: true } : { value: body };
}
