export function isActivePath(pathname, to) {
  if (to === '/dashboard') {
    return pathname === '/dashboard'
  }

  return pathname === to || pathname.startsWith(`${to}/`)
}
