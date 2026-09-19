import { Link, NavLink, useNavigate } from 'react-router-dom'
import { navItems } from '../data/navigation.js'
import { isActivePath } from '../utils/nav.js'

function Sidebar({ pathname, isDrawer, onNavigate }) {
  const navigate = useNavigate()

  function handleLogout() {
    onNavigate?.()
    navigate('/login')
  }

  return (
    <aside className={`sidebar${isDrawer ? ' is-drawer' : ''}`} aria-label="Primary">
      <Link to="/dashboard" className="sidebar-brand" onClick={onNavigate}>
        BizFlow AI
      </Link>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={() => `sidebar-link${isActivePath(pathname, item.to) ? ' is-active' : ''}`}
            aria-current={isActivePath(pathname, item.to) ? 'page' : undefined}
            onClick={onNavigate}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
