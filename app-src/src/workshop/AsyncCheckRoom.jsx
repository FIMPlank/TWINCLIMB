import { useState } from 'react'
import { DIMENSIONS, dimName, PALETTE } from '../ttcmm'
import { updateSession } from './api'
import ParticipantRollCall from './components/ParticipantRollCall'
import SummaryReport from './components/SummaryReport'

const cardStyle = { background: 'var(--ws-surface)', border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-lg)', boxShadow: 'var(--ws-shadow-soft)', padding: 28 }
const h2Style = { fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 'clamp(24px,3vw,32px)', margin: '8px 0 6px', letterSpacing: '-0.01em' }
const bodyMuted = { fontSize: 15, lineHeight: 1.6, color: 'var(--ws-text-muted)', maxWidth: '68ch' }

// The organizer side of an async team check: no live phases, no facilitator
// bar, no timer — just "share the code, watch people finish, generate the
// report whenever you're ready." Reuses the exact same participant/response
// data and the same SummaryReport as the live workshop's Commit stage.
export default function AsyncCheckRoom({ strings, lang, sessionId, session, participants }) {
  const [copied, setCopied] = useState(false)
  const joinUrl = `${window.location.origin}${window.location.pathname.replace(/workshop(\.de)?\.html$/, `workshop${lang === 'de' ? '.de' : ''}.html`)}?code=${session.code}`

  function copyLink() {
    navigator.clipboard?.writeText(joinUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) })
  }
  function generateReport() {
    updateSession(sessionId, { phase: 'summary' })
  }

  return (
    <div>
      <div
        data-print-hide=""
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '14px 28px', background: 'var(--ws-surface-dark)', color: 'var(--ws-text-on-dark)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={copyLink}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 13px', border: '1px solid var(--ws-border-on-dark)', borderRadius: 20, background: 'transparent', color: 'var(--ws-text-on-dark)', fontSize: 13, fontFamily: 'var(--ws-font-mono)' }}
          >
            <span style={{ fontWeight: 700, letterSpacing: '0.1em' }}>{session.code}</span>
            <span style={{ color: 'var(--ws-text-muted-on-dark)' }}>{copied ? strings.wsCopyLinkDone : strings.wsCopyLink}</span>
          </button>
          <span style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ws-brand-bright)', border: '1px solid var(--ws-border-on-dark)', borderRadius: 20, padding: '5px 12px' }}>
            {strings.wsAsyncBadge}
          </span>
          {session.company_name && <span style={{ fontSize: 13.5, fontWeight: 600 }}>{session.company_name}</span>}
        </div>
        {session.phase === 'prework' && (
          <button onClick={generateReport} disabled={participants.length === 0} style={{ padding: '9px 18px', border: 'none', borderRadius: 'var(--ws-radius-sm)', background: 'var(--ws-brand-bright)', color: 'var(--ws-ink-on-brand-bright)', fontSize: 13, fontFamily: 'var(--ws-font-head)', fontWeight: 700, opacity: participants.length === 0 ? 0.4 : 1 }}>
            {strings.wsAsyncGenerateReport}
          </button>
        )}
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '36px 28px 100px' }}>
        {session.context_note && (
          <div data-print-hide="" className="ws-animate-fade" style={{ marginBottom: 22, padding: '12px 16px', background: 'var(--ws-context-bg)', border: '1px solid var(--ws-context-border)', borderRadius: 'var(--ws-radius-sm)', fontSize: 13.5, color: 'var(--ws-context-text)', whiteSpace: 'pre-wrap' }}>
            {session.context_note}
          </div>
        )}

        {session.phase === 'prework' && (
          <div className="ws-animate-in">
            <h2 style={h2Style}>{strings.wsAsyncRoomTitle}</h2>
            <p style={bodyMuted}>{strings.wsAsyncRoomIntro}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
              {DIMENSIONS.map((d, i) => (
                <span key={d.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, padding: '6px 12px', borderRadius: 20, border: '1px solid var(--ws-border-soft)', background: 'var(--ws-surface)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: PALETTE[i] }} />
                  {dimName(d, lang)}
                </span>
              ))}
            </div>
            <div style={{ ...cardStyle, marginTop: 24, padding: 22 }}>
              <ParticipantRollCall strings={strings} participants={participants} dimCount={DIMENSIONS.length} />
            </div>
          </div>
        )}

        {session.phase === 'summary' && (
          <div className="ws-animate-in">
            <SummaryReport strings={strings} lang={lang} dims={DIMENSIONS} session={session} participants={participants} responses={[]} moves={[]} isFacilitator onPrint={() => window.print()} mode="async" />
          </div>
        )}

        <div data-print-hide="" style={{ marginTop: 44, paddingTop: 18, borderTop: '1px solid var(--ws-border-soft)' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, color: 'var(--ws-text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!session.research_opt_in} onChange={(e) => updateSession(sessionId, { research_opt_in: e.target.checked })} style={{ marginTop: 2 }} />
            {strings.wsResearchOptInLabel}
          </label>
          <p style={{ fontSize: 11.5, color: 'var(--ws-text-muted)', marginTop: 10 }}>{strings.wsPinDisplay(session.facilitator_pin)}</p>
        </div>
      </div>
    </div>
  )
}
