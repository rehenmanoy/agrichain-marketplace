import { env } from "../config/env.js";

/**
 * Sends the one-time "forgot password" code to a phone.
 * No SMS provider is connected yet, so the message is written to the server console. To send real
 * messages, replace the body of this function with a call to the provider; nothing else changes.
 */
export async function sendResetCode(phone, code) {
  if (env.isTest) return;
  console.log(`[SMS to ${phone}] Your AgriChain code is ${code}. It works for 10 minutes.`);
}
