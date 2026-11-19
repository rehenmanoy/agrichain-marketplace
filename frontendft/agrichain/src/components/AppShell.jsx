import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'

/**
 * The frame around every role's pages: deep green with faint field contour lines at the
 * sides, the role's header on top, and the page itself on light paper in the middle.
 */
export function AppShell({ header }) {
  const { pathname } = useLocation()

  // New page: start at the top
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col bg-forest-deep bg-[url('/field-lines.svg')] bg-fixed">
      {header}
      <div className="relative mx-auto w-full max-w-[1280px] flex-1 bg-paper">
        <main className="mx-auto max-w-6xl px-8 pt-10 pb-20">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
