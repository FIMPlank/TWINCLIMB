import { useEffect, useState } from 'react'
import { DIMENSIONS, dimName, PALETTE } from '../ttcmm'
import { useWorkshopSession } from './useWorkshopSession'
import { usePrefersReducedMotion, useElapsedSeconds } from './hooks'
import { updateSession } from './api'
import WorkshopProgress from './components/WorkshopProgress'
import FacilitatorBar from './components/FacilitatorBar'
import RadarPresentation from './components/RadarPresentation'
import WorkshopInsight from './components/WorkshopInsight'
import SpreadChart from './components/SpreadChart'
import DeepDiveView from './components/DeepDiveView'
import MoveBoard from './components/MoveBoard'
import SummaryReport from './components/SummaryReport'
import ParticipantRollCall from './components/ParticipantRollCall'
import AsyncCheckRoom from './AsyncCheckRoom'

const PHASES = ['prework', 'opening', 'calibration', 'deepdive', 'prioritization', 'summary']

const cardStyle = { background: 'var(--ws-surface)', border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-lg)', boxShadow: 'var(--ws-shadow-soft)', padding: 28 }
const stageLabelStyle = { fontFamily: 'var(--ws-font-mono)', fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ws-text-muted)' }
const h2Style = { fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 'clamp(24px,3vw,32px)', margin: '8px 0 6px', letterSpacing: '-0.01em' }
const bodyMuted = { fontSize: 15, lineHeight: 1.6, color: 'var(--ws-text-muted)', maxWidth: '68ch' }

export default function FacilitatorRoom({ strings, lang, sessionId }) {
  const { session, participants, responses, moves, loading, error } = useWorkshopSession(sessionId)
  const reducedMotion = usePrefersReducedMotion()
  const [copied, setCopied] = useState(false)
  const verifiedKey = `twinclimb_ws_fac_verified_${sessionId}`
  const [verified, setVerified] = useState(() => { try { return localStorage.getItem(verifiedKey) === '1' } catch (e) { return false } })
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const elapsedSeconds = useElapsedSeconds(session?.phase)

  // A link into this session (e.g. an org unit's "open control room" button)
  // can carry its own PIN as ?pin=... -- the person clicking it already
  // authenticated one level up (the org's facilitator PIN), which is never
  // the same PIN as this session's own, so re-prompting them for a PIN they
  // were never shown would just fail every time.
  useEffect(() => {
    if (verified || !session) return
    const urlPin = new URLSearchParams(window.location.search).get('pin')
    if (urlPin && urlPin === session.facilitator_pin) {
      try { localStorage.setItem(verifiedKey, '1') } catch (err) {}
      setVerified(true)
    }
  }, [session, verified, verifiedKey])

  if (loading) return <p style={{ padding: 60, color: 'var(--ws-text-muted)', textAlign: 'center' }}>…</p>
  if (error || !session) return <p style={{ padding: 60, color: 'var(--ws-danger)', textAlign: 'center' }}>{strings.wsNoSession}</p>

  if (!verified) {
    const submitPin = (e) => {
      e.preventDefault()
      if (pin === session.facilitator_pin) {
        try { localStorage.setItem(verifiedKey, '1') } catch (err) {}
        setVerified(true)
      } else {
        setPinError(true)
      }
    }
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <form onSubmit={submitPin} style={{ ...cardStyle, maxWidth: 360, width: '100%', textAlign: 'center' }}>
          <p style={{ fontSize: 14.5, color: 'var(--ws-text-muted)', marginBottom: 14 }}>{strings.wsPinPrompt}</p>
          <input
            value={pin} onChange={(e) => { setPin(e.target.value); setPinError(false) }} placeholder={strings.wsPinPlaceholder} autoFocus
            style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 'var(--ws-radius-sm)', border: '1.5px solid var(--ws-border-soft)', background: 'var(--ws-surface)', color: 'var(--ws-text-primary)', fontSize: 20, textAlign: 'center', letterSpacing: '0.3em', fontFamily: 'var(--ws-font-mono)' }}
          />
          {pinError && <p style={{ color: 'var(--ws-danger)', fontSize: 13, marginTop: 10 }}>{strings.wsPinWrong}</p>}
          <button type="submit" style={{ marginTop: 16, width: '100%', padding: '13px 22px', border: 'none', borderRadius: 'var(--ws-radius-sm)', background: 'var(--ws-brand)', color: 'var(--ws-ink-on-brand)', fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 14 }}>
            {strings.wsPinSubmit}
          </button>
        </form>
      </div>
    )
  }

  if (session.mode === 'async') {
    return <AsyncCheckRoom strings={strings} lang={lang} sessionId={sessionId} session={session} participants={participants} responses={responses} moves={moves} />
  }

  const phaseIdx = PHASES.indexOf(session.phase)
  const joinUrl = `${window.location.origin}${window.location.pathname.replace(/workshop(\.de)?\.html$/, `workshop${lang === 'de' ? '.de' : ''}.html`)}?code=${session.code}`

  function goPhase(delta) {
    const next = PHASES[phaseIdx + delta]
    if (next) updateSession(sessionId, { phase: next })
  }
  function copyLink() {
    navigator.clipboard?.writeText(joinUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) })
  }

  const calibIdx = Math.max(0, DIMENSIONS.findIndex((d) => d.id === session.active_dimension_id))
  const calibDim = DIMENSIONS[calibIdx] || DIMENSIONS[0]
  const solo = participants.length <= 1
  function setCalibDim(idx) { updateSession(sessionId, { active_dimension_id: DIMENSIONS[idx].id }) }

  const totalMinutes = Object.values(session.phase_minutes || {}).reduce((a, b) => a + Number(b || 0), 0)

  return (
    <div>
      <WorkshopProgress strings={strings} phase={session.phase} />

      <FacilitatorBar
        strings={strings} session={session} participantCount={participants.length} elapsedSeconds={elapsedSeconds} copied={copied}
        onCopyLink={copyLink} onPrevPhase={() => goPhase(-1)} onNextPhase={() => goPhase(1)}
        canGoPrev={phaseIdx > 0} canGoNext={phaseIdx < PHASES.length - 1}
      />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '36px 28px 100px' }}>
        {session.context_note && (
          <div data-print-hide="" className="ws-animate-fade" style={{ marginBottom: 22, padding: '12px 16px', background: 'var(--ws-context-bg)', border: '1px solid var(--ws-context-border)', borderRadius: 'var(--ws-radius-sm)', fontSize: 13.5, color: 'var(--ws-context-text)', whiteSpace: 'pre-wrap' }}>
            {session.context_note}
          </div>
        )}

        {session.phase === 'prework' && (
          <div className="ws-animate-in">
            <div style={stageLabelStyle}>{strings.wsStageOf(1, 5)}</div>
            <h2 style={h2Style}>{strings.wsPreworkTitle}</h2>
            <p style={bodyMuted}>{strings.wsPreworkIntro}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
              {DIMENSIONS.map((d, i) => (
                <span key={d.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, padding: '6px 12px', borderRadius: 20, border: '1px solid var(--ws-border-soft)', background: 'var(--ws-surface)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: PALETTE[i] }} />
                  {dimName(d, lang)}
                </span>
              ))}
            </div>

            {totalMinutes > 0 && <p style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 12.5, color: 'var(--ws-text-muted)', marginTop: 14 }}>{strings.wsPlannedDuration(totalMinutes)}</p>}

            <div style={{ ...cardStyle, marginTop: 24, padding: 22 }}>
              <ParticipantRollCall strings={strings} participants={participants} dimCount={DIMENSIONS.length} />
            </div>
          </div>
        )}

        {session.phase === 'opening' && (
          <div className="ws-animate-in">
            <div style={stageLabelStyle}>{strings.wsStageOf(2, 5)}</div>
            <h2 style={h2Style}>{solo ? strings.wsOpeningTitleSolo : strings.wsOpeningTitle}</h2>
            <p style={bodyMuted}>{solo ? strings.wsOpeningIntroSolo : strings.wsOpeningIntro}</p>
            <div style={{ ...cardStyle, marginTop: 24 }}>
              <RadarPresentation strings={strings} lang={lang} dims={DIMENSIONS} participants={participants} emptyLabel={strings.wsNoPreworkYet} />
            </div>
          </div>
        )}

        {session.phase === 'calibration' && (
          <div className="ws-animate-in">
            <div style={stageLabelStyle}>{strings.wsStageOf(3, 5)}</div>
            <h2 style={h2Style}>{strings.wsCalibrationTitle}</h2>
            <p style={bodyMuted}>{solo ? strings.wsCalibrationIntroSolo : strings.wsCalibrationIntro}</p>
            <div style={{ ...cardStyle, marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => setCalibDim(Math.max(0, calibIdx - 1))} disabled={calibIdx <= 0} aria-label={strings.wsPreviousDimension} style={{ padding: '10px 16px', border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-sm)', background: 'var(--ws-surface)', color: 'var(--ws-text-primary)', fontSize: 15, opacity: calibIdx <= 0 ? 0.35 : 1 }}>←</button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 11.5, color: 'var(--ws-text-muted)' }}>{strings.wsDimensionOf(calibIdx + 1, DIMENSIONS.length)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 24, marginTop: 3 }}>
                    <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 4, background: PALETTE[calibIdx] }} />
                    {dimName(calibDim, lang)}
                  </div>
                </div>
                <button onClick={() => setCalibDim(Math.min(DIMENSIONS.length - 1, calibIdx + 1))} disabled={calibIdx >= DIMENSIONS.length - 1} aria-label={strings.wsNextDimension} style={{ padding: '10px 16px', border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-sm)', background: 'var(--ws-surface)', color: 'var(--ws-text-primary)', fontSize: 15, opacity: calibIdx >= DIMENSIONS.length - 1 ? 0.35 : 1 }}>→</button>
              </div>
              <SpreadChart strings={strings} dimension={calibDim} participants={participants} color={PALETTE[calibIdx]} />
            </div>
          </div>
        )}

        {session.phase === 'deepdive' && (
          <div className="ws-animate-in">
            <div style={stageLabelStyle}>{strings.wsStageOf(4, 5)}</div>
            <h2 style={h2Style}>{strings.wsDeepdiveTitle}</h2>
            <p style={bodyMuted}>{solo ? strings.wsDeepdiveIntroSolo : strings.wsDeepdiveIntro}</p>
            {!solo && <WorkshopInsight strings={strings} lang={lang} dims={DIMENSIONS} participants={participants} />}
            <DeepDiveView
              strings={strings} lang={lang} dims={DIMENSIONS} session={session} participants={participants} responses={responses}
              sessionId={sessionId} isFacilitator reducedMotion={reducedMotion}
              onToggleDimension={(id) => {
                const cur = session.deep_dive_dimension_ids || []
                const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
                updateSession(sessionId, { deep_dive_dimension_ids: next })
              }}
            />
          </div>
        )}

        {session.phase === 'prioritization' && (
          <div className="ws-animate-in">
            <div style={stageLabelStyle}>{strings.wsStageOf(5, 5)}</div>
            <h2 style={h2Style}>{strings.wsPrioritizationTitle}</h2>
            <p style={bodyMuted}>{strings.wsPrioritizationIntro}</p>
            <div style={{ ...cardStyle, marginTop: 24 }}>
              <MoveBoard strings={strings} sessionId={sessionId} moves={moves} editable />
            </div>
          </div>
        )}

        {session.phase === 'summary' && (
          <div className="ws-animate-in">
            <div style={stageLabelStyle}>{strings.wsStageOf(5, 5)}</div>
            <SummaryReport strings={strings} lang={lang} dims={DIMENSIONS} session={session} participants={participants} responses={responses} moves={moves} isFacilitator onPrint={() => window.print()} />
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
