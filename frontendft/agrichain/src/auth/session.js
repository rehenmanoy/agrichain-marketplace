// Timing and storage for the automatic log off. The login lasts while the user is active:
// the app swaps the token for a fresh one now and then, and logs out after a quiet spell.

const minutes = Number(import.meta.env.VITE_IDLE_MINUTES) || 60

/** Logged out after this long without a click, key press or scroll */
export const IDLE_MS = minutes * 60_000
/** A warning shows this long before that, with a button to stay logged in */
export const WARN_MS = Math.min(60_000, IDLE_MS / 3)
/** While the user is active the token is renewed this often (it lives for an hour on the server) */
export const RENEW_MS = Math.min(20 * 60_000, IDLE_MS / 3)

const ACTIVITY_KEY = 'agrichain_last_activity'
const REASON_KEY = 'agrichain_logout_reason'

/** When the user last did something, kept for the browser session so a reload or a sleeping laptop is judged fairly */
export function getLastActivity() {
  try {
    const stored = Number(sessionStorage.getItem(ACTIVITY_KEY))
    return stored || Date.now()
  } catch {
    return Date.now()
  }
}

export function touchActivity() {
  try {
    sessionStorage.setItem(ACTIVITY_KEY, String(Date.now()))
  } catch {
    // storage blocked: the in-memory timer still works
  }
}

/** Why the user was logged out ('idle' or 'expired'), shown once on the login page */
export function setLogoutReason(reason) {
  try {
    sessionStorage.setItem(REASON_KEY, reason)
  } catch {
    // the notice is only a courtesy
  }
}

export function peekLogoutReason() {
  try {
    return sessionStorage.getItem(REASON_KEY)
  } catch {
    return null
  }
}

export function clearLogoutReason() {
  try {
    sessionStorage.removeItem(REASON_KEY)
  } catch {
    // nothing to clear
  }
}
