import axios from 'axios'

const TOKEN_KEY = 'agrichain_token'

// The login lives in sessionStorage, so closing the browser (or the tab) logs the user out.
// Earlier versions kept it in localStorage for days; that copy is removed so it can't be used.
try {
  localStorage.removeItem(TOKEN_KEY)
} catch {
  // storage blocked: nothing to remove
}

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveToken(token) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
  } catch {
    // storage blocked: the session lasts until the page is reloaded
  }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // nothing to clear
  }
}

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api`,
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Set by AuthProvider: an expired or invalid token sends the user back to login
let handleUnauthorized = () => {}
export function setUnauthorizedHandler(fn) {
  handleUnauthorized = fn
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) handleUnauthorized('expired')
    return Promise.reject(error)
  },
)

/**
 * True when the server couldn't be reached: no response at all (offline, timeout, server off),
 * a gateway error (502/503/504), or a 5xx without the API's JSON { error } body, which is what
 * the dev proxy sends when the backend is down. A normal API error (it has a JSON body) is not one.
 */
export function isConnectionError(error) {
  if (!axios.isAxiosError(error)) return false
  if (!error.response) return error.code !== 'ERR_CANCELED'
  const { status, data } = error.response
  if ([502, 503, 504].includes(status)) return true
  return status >= 500 && !data?.error
}

/** Full address of a file the API serves (warehouse photos), whether the API is proxied or on another origin */
export const assetUrl = (path) => `${import.meta.env.VITE_API_URL ?? ''}${path}`

/** GET helper that returns the response body */
export const fetchJson = (url, config) => api.get(url, config).then((res) => res.data)
