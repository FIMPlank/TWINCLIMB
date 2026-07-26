import { useEffect, useState } from 'react'
import ThemeToggle from '../../components/ThemeToggle'

function useFullscreen() {
  const [active, setActive] = useState(false)
  useEffect(() => {
    const onChange = () => setActive(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen?.().catch(() => {})
  }
  return [active, toggle]
}

// Dark, sticky, lightweight — identity + session title + language + presentation mode.
export default function WorkshopHeader({ strings, lang, title }) {
  const [fullscreen, toggleFullscreen] = useFullscreen()
  const otherLangHref = (lang === 'de' ? 'workshop.html' : 'workshop.de.html') + window.location.search
  const canFullscreen = typeof document !== 'undefined' && document.documentElement.requestFullscreen

  return (
    <header
      data-print-hide=""
      style={{
        position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        padding: '13px 28px', background: 'var(--ws-bg-deep)', color: 'var(--ws-text-on-dark)', borderBottom: '1px solid var(--ws-border-on-dark)',
      }}
    >
      <a
        href={lang === 'de' ? 'workshop.de.html' : 'workshop.html'}
        style={{ display: 'flex', alignItems: 'baseline', gap: 10, textDecoration: 'none', color: 'inherit', minWidth: 0 }}
      >
        <span style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 14.5, letterSpacing: '0.14em', flex: 'none' }}>TWINCLIMB</span>
        <span
          style={{
            fontFamily: 'var(--ws-font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--ws-text-muted-on-dark)', textTransform: 'uppercase',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {title || strings.wsBrand}
        </span>
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 'none' }}>
        <ThemeToggle strings={strings} className="ws-theme-toggle" darkColor="#0d1714" lightColor="#eef1eb" />
        {canFullscreen && (
          <button
            onClick={toggleFullscreen}
            aria-label={fullscreen ? strings.wsExitFullscreen : strings.wsEnterFullscreen}
            title={fullscreen ? strings.wsExitFullscreen : strings.wsEnterFullscreen}
            style={{
              background: 'transparent', border: '1px solid var(--ws-border-on-dark)', borderRadius: 8, width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ws-text-on-dark)', fontSize: 15, transition: 'background 180ms',
            }}
          >
            <span aria-hidden="true">{fullscreen ? '⤡' : '⤢'}</span>
          </button>
        )}
        <a href={otherLangHref} style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 12, letterSpacing: '0.06em', color: 'var(--ws-text-muted-on-dark)', textDecoration: 'none' }}>
          {lang === 'de' ? 'EN' : 'DE'}
        </a>
      </div>
    </header>
  )
}
