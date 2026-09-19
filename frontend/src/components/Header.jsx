import Button from './Button.jsx'

function Header({ title, onMenuClick, showMenu }) {
  return (
    <header className="header">
      <div className="header-left">
        {showMenu ? (
          <Button
            variant="secondary"
            className="btn-icon menu-toggle"
            onClick={onMenuClick}
            aria-label="Open navigation"
          >
            Menu
          </Button>
        ) : null}
        <p className="header-title">{title}</p>
      </div>
      <p className="header-user">Workspace</p>
    </header>
  )
}

export default Header
