import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './i18n'
import './index.css'
import { AuthProvider } from './auth/AuthProvider'
import { ToastProvider } from './components/ToastProvider'
import { isConnectionError } from './lib/api'
import { router } from './router'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // Runs once a query has given up. If a page couldn't load at all because the server can't be
    // reached, show the 404 page. Refreshes of data that's already on screen are left alone, and
    // actions (mutations) show their own message instead.
    onError: (error, query) => {
      if (query.state.data !== undefined || !isConnectionError(error)) return
      if (window.location.pathname === '/404error') return
      router.navigate('/404error', {
        replace: true,
        state: { reason: 'connection', from: window.location.pathname + window.location.search },
      })
    },
  }),
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
