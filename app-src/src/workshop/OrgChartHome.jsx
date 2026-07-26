import { useState } from 'react'
import { createOrgChart, createOrgUnit } from './orgApi'
import HeroContours from './components/HeroContours'

export default function OrgChartHome({ strings, lang, onCreated }) {
  const [name, setName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 'var(--ws-radius-sm)',
    border: '1.5px solid var(--ws-border-soft)', fontSize: 15, fontFamily: 'inherit', background: 'var(--ws-surface)', color: 'var(--ws-text-primary)',
  }
  const labelStyle = {
    display: 'block', fontFamily: 'var(--ws-font-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--ws-text-muted)',
    textTransform: 'uppercase', marginBottom: 8, marginTop: 18,
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim() || !orgName.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      const org = await createOrgChart(name.trim(), lang, orgName.trim())
      await createOrgUnit(org, null, orgName.trim())
      onCreated(org)
    } catch (err) {
      setError(String(err.message || err))
      setBusy(false)
    }
  }

  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, var(--ws-bg-deep) 0%, var(--ws-bg-elevated) 100%)', padding: '72px 28px 96px' }}>
      <HeroContours />
      <div className="ws-hero-glow" style={{ top: -140, right: -120 }} aria-hidden="true" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
        <span
          className="ws-animate-fade"
          style={{
            display: 'inline-block', fontFamily: 'var(--ws-font-mono)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--ws-brand-bright)', border: '1px solid var(--ws-border-on-dark)', borderRadius: 20, padding: '6px 14px',
          }}
        >
          {strings.wsOrgKicker}
        </span>

        <h1 className="ws-animate-in" style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 'clamp(32px,4.6vw,48px)', lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--ws-text-on-dark)', margin: '20px 0 0' }}>
          {strings.wsOrgHomeTitle}
        </h1>
        <p className="ws-animate-in" style={{ fontSize: 16.5, lineHeight: 1.6, color: 'var(--ws-text-muted-on-dark)', margin: '16px 0 0', maxWidth: '58ch' }}>
          {strings.wsOrgHomeIntro}
        </p>

        <form
          onSubmit={handleCreate}
          className="ws-animate-in"
          style={{ marginTop: 34, background: 'var(--ws-surface)', borderRadius: 'var(--ws-radius-lg)', padding: 28, boxShadow: 'var(--ws-shadow-deep)' }}
        >
          <label style={{ ...labelStyle, marginTop: 0 }}>{strings.wsOrgNameLabel}</label>
          <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder={strings.wsOrgNamePlaceholder} autoFocus style={inputStyle} />

          <label style={labelStyle}>{strings.wsFacilitatorNameLabel}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={strings.wsFacilitatorNamePlaceholder} style={inputStyle} />

          {error && <p style={{ color: 'var(--ws-danger)', fontSize: 13, marginTop: 10 }}>{error}</p>}
          <button
            type="submit" disabled={busy || !name.trim() || !orgName.trim()}
            style={{
              marginTop: 20, width: '100%', padding: '15px 26px', border: 'none', borderRadius: 'var(--ws-radius-sm)',
              background: busy ? 'var(--ws-disabled)' : 'var(--ws-brand)', color: 'var(--ws-ink-on-brand)', fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 15,
              cursor: busy ? 'default' : 'pointer', transition: 'background 180ms',
            }}
          >
            {busy ? strings.wsCreating : strings.wsOrgCreate}
          </button>
        </form>
      </div>
    </section>
  )
}
