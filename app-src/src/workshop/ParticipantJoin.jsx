import { useEffect, useState } from 'react'
import { fetchSessionByCode, joinAsParticipant } from './api'
import HeroContours from './components/HeroContours'

export default function ParticipantJoin({ strings, code, onJoined }) {
  const [session, setSession] = useState(undefined) // undefined = loading, null = not found
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSessionByCode(code).then(setSession).catch(() => setSession(null))
  }, [code])

  async function handleJoin(e) {
    e.preventDefault()
    if (!name.trim()) { setError(strings.wsJoinMissingName); return }
    setBusy(true)
    setError('')
    try {
      const p = await joinAsParticipant(session.id, name.trim())
      onJoined(p, session.id)
    } catch (err) {
      setError(String(err.message || err))
      setBusy(false)
    }
  }

  return (
    <section style={{ position: 'relative', overflow: 'hidden', minHeight: '80vh', background: 'linear-gradient(180deg, var(--ws-bg-deep) 0%, var(--ws-bg-elevated) 100%)', padding: '56px 20px 80px' }}>
      <HeroContours />
      <div className="ws-hero-glow" style={{ top: -120, left: -140 }} aria-hidden="true" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 440, margin: '0 auto' }}>
        <span style={{ display: 'inline-block', fontFamily: 'var(--ws-font-mono)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ws-brand-bright)', border: '1px solid var(--ws-border-on-dark)', borderRadius: 20, padding: '6px 14px' }}>
          {strings.wsBrand}
        </span>
        <h1 style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 'clamp(26px,6vw,34px)', color: 'var(--ws-text-on-dark)', margin: '18px 0 0' }}>{strings.wsJoinTitle}</h1>

        {session === undefined && <p style={{ color: 'var(--ws-text-muted-on-dark)', marginTop: 20 }}>…</p>}
        {session === null && <p style={{ color: 'var(--ws-danger-bright)', marginTop: 20 }}>{strings.wsJoinInvalidCode}</p>}
        {session && session.phase !== 'prework' && (
          <div style={{ marginTop: 20, background: 'var(--ws-surface)', borderRadius: 'var(--ws-radius-lg)', padding: 22 }}>
            <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--ws-text-primary)' }}>{strings.wsJoiningLockedTitle}</p>
            <p style={{ color: 'var(--ws-text-muted)', fontSize: 13.5, marginTop: 8 }}>{strings.wsJoiningLockedBody}</p>
          </div>
        )}

        {session && session.phase === 'prework' && (
          <form onSubmit={handleJoin} style={{ marginTop: 26, background: 'var(--ws-surface)', borderRadius: 'var(--ws-radius-lg)', padding: 24, boxShadow: 'var(--ws-shadow-deep)' }}>
            <div style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 12, letterSpacing: '0.1em', color: 'var(--ws-text-muted)', marginBottom: 16 }}>{strings.wsJoinCodeLabel}: <strong style={{ color: 'var(--ws-text-primary)' }}>{session.code}</strong></div>
            <label style={{ display: 'block', fontFamily: 'var(--ws-font-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--ws-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              {strings.wsJoinNameLabel}
            </label>
            <input
              value={name} onChange={(e) => setName(e.target.value)} placeholder={strings.wsJoinNamePlaceholder} autoFocus
              style={{ width: '100%', boxSizing: 'border-box', padding: '14px 14px', borderRadius: 'var(--ws-radius-sm)', border: '1.5px solid var(--ws-border-soft)', fontSize: 16, fontFamily: 'inherit', minHeight: 44 }}
            />
            {error && <p style={{ color: 'var(--ws-danger)', fontSize: 13, marginTop: 10 }}>{error}</p>}
            <button
              type="submit" disabled={busy}
              style={{ marginTop: 16, width: '100%', minHeight: 48, padding: '14px 22px', border: 'none', borderRadius: 'var(--ws-radius-sm)', background: busy ? 'var(--ws-disabled)' : 'var(--ws-brand)', color: 'var(--ws-ink-on-brand)', fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 15 }}
            >
              {busy ? strings.wsJoining : strings.wsJoinBtn}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
