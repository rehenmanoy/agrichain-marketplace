import { createContext, useContext } from 'react'

export const ToastContext = createContext(() => {})

/** Returns toast(message, tone?) where tone is 'success' (default) or 'error' */
export const useToast = () => useContext(ToastContext)
