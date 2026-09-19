import { useEffect, useState } from 'react'

const LAPTOP_MIN = 1024

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }
    return window.matchMedia(`(min-width: ${LAPTOP_MIN}px)`).matches
  })

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${LAPTOP_MIN}px)`)
    const onChange = () => setIsDesktop(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}
