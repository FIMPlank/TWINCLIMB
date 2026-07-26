import { useEffect, useState } from 'react'

const KEY = 'twinclimb_theme'
const DARK_COLOR = '#0A1120'
const LIGHT_COLOR = '#FAF6EC'

function currentTheme() {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'light' || attr === 'dark') return attr
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark'
}

// Shares the landing page's data-theme attribute + twinclimb_theme
// localStorage key, so a visitor's theme choice carries over between the
// landing page, the assessment app, and workshop mode in either direction.
// darkColor/lightColor only affect this page's own <meta name="theme-color">
// (the mobile browser-chrome tint), so each app can pass its own brand color.
export default function ThemeToggle({ strings, className = 'as-theme-toggle', darkColor = DARK_COLOR, lightColor = LIGHT_COLOR }) {
  const [theme, setTheme] = useState(currentTheme)

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'light' ? lightColor : darkColor)
  }, [theme, darkColor, lightColor])

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem(KEY, next) } catch (e) {}
    setTheme(next)
  }

  return (
    <button
      type="button" className={className} onClick={toggle}
      aria-pressed={theme === 'light'} aria-label={theme === 'light' ? strings.themeToDark : strings.themeToLight}
    >
      <svg className="as-icon-sun" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4.3" stroke="currentColor" strokeWidth="1.7"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.1 5.1l2.1 2.1M16.8 16.8l2.1 2.1M18.9 5.1l-2.1 2.1M7.2 16.8l-2.1 2.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
      <svg className="as-icon-moon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 14.3A8.1 8.1 0 0 1 9.7 4 6.6 6.6 0 1 0 20 14.3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
    </button>
  )
}
