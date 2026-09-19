import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Sidebar from '../components/Sidebar.jsx'
import { getPageTitle } from '../data/navigation.js'
import { useIsDesktop } from '../hooks/useIsDesktop.js'

function AppLayout() {
  const { pathname } = useLocation()
  const isDesktop = useIsDesktop()
  const [menuOpen, setMenuOpen] = useState(false)
  const title = getPageTitle(pathname)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isDesktop) {
      setMenuOpen(false)
    }
  }, [isDesktop])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    if (!menuOpen || isDesktop) {
      return undefined
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen, isDesktop])

  return (
    <div className="app-shell">
      {isDesktop ? <Sidebar pathname={pathname} /> : null}
      {!isDesktop && menuOpen ? (
        <>
          <button
            type="button"
            className="overlay"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          />
          <Sidebar pathname={pathname} isDrawer onNavigate={() => setMenuOpen(false)} />
        </>
      ) : null}
      <div className="app-main">
        <Header title={title} showMenu={!isDesktop} onMenuClick={() => setMenuOpen(true)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
