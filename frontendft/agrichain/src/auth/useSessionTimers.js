import { useCallback, useEffect, useRef, useState } from 'react'
import { IDLE_MS, RENEW_MS, WARN_MS, getLastActivity, touchActivity } from './session'

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'wheel', 'touchstart']
const THROTTLE_MS = 5_000

/**
 * Watches for a signed-in user going quiet. While they are active it calls onRenew now and then
 * (a fresh token); after IDLE_MS of nothing it calls onIdle. Shortly before that, `secondsLeft`
 * counts down so a warning can be shown; only stay() cancels it, so a nudge of the mouse can't
 * make the warning vanish by accident. Polling in the background doesn't count as activity.
 */
export function useSessionTimers({ enabled, onIdle, onRenew }) {
  const [secondsLeft, setSecondsLeft] = useState(null)
  const callbacks = useRef({ onIdle, onRenew })
  const state = useRef({ lastActivity: 0, lastMark: 0, lastRenew: 0, activeSinceRenew: false, warning: false })

  useEffect(() => {
    callbacks.current = { onIdle, onRenew }
  })

  const mark = useCallback(() => {
    const now = Date.now()
    state.current.lastActivity = now
    state.current.activeSinceRenew = true
    state.current.lastMark = now
    touchActivity()
  }, [])

  const stay = useCallback(() => {
    state.current.warning = false
    setSecondsLeft(null)
    mark()
    state.current.lastRenew = Date.now()
    callbacks.current.onRenew()
  }, [mark])

  useEffect(() => {
    if (!enabled) return undefined
    const s = state.current
    s.lastActivity = getLastActivity()
    s.lastRenew = Date.now()
    s.activeSinceRenew = false
    s.warning = false

    const onActivity = () => {
      if (s.warning || Date.now() - s.lastMark < THROTTLE_MS) return
      mark()
    }
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }))

    const tick = () => {
      const now = Date.now()
      // Another tab of the same login may have been used since; the stored time is the truth
      if (!s.warning) s.lastActivity = Math.max(s.lastActivity, getLastActivity())
      const idle = now - s.lastActivity

      if (idle >= IDLE_MS) {
        s.warning = false
        setSecondsLeft(null)
        callbacks.current.onIdle()
        return
      }
      if (idle >= IDLE_MS - WARN_MS) {
        s.warning = true
        setSecondsLeft(Math.max(1, Math.ceil((IDLE_MS - idle) / 1000)))
        return
      }
      if (s.activeSinceRenew && now - s.lastRenew >= RENEW_MS) {
        s.lastRenew = now
        s.activeSinceRenew = false
        callbacks.current.onRenew()
      }
    }

    const timer = setInterval(tick, 1000)
    tick() // a reload after a long sleep is judged straight away
    return () => {
      clearInterval(timer)
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity))
    }
  }, [enabled, mark])

  return { secondsLeft, stay }
}
