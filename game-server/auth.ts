import crypto from "node:crypto";
import { config } from "./config";

function sha(s: string) {
  return crypto.createHash("sha256").update(s).digest();
}

export function safeEqual(a: string, b: string) {
  return crypto.timingSafeEqual(sha(a), sha(b));
}

export function checkPassword(given: unknown) {
  return !!config.hostPassword && typeof given === "string" && safeEqual(given, config.hostPassword);
}
