import { dimName, capText } from '../../ttcmm'
import OverlayRadar, { participantColor } from './OverlayRadar'
import MoveBoard from './MoveBoard'
import WorkshopInsight from './WorkshopInsight'

function referenceStage(dim, participants) {
  const vals = participants.map((p) => p.answers?.[dim.id]).filter((v) => v !== undefined && v !== null)
  return vals.length ? Math.min(...vals) : 0
}

function recheckDate(createdAt, lang) {
  const d = new Date(createdAt)
  d.setMonth(d.getMonth() + 3)
  return d.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Small, subtle route-to-summit glyph — not a decorative illustration, just
// an accent confirming the climb metaphor at the close.
function SummitGlyph() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <path d="M4,28 C10,20 13,15 17,8 C21,15 24,20 30,28" fill="none" stroke="var(--ws-brand-bright)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="8" r="2.6" fill="var(--ws-brand-bright)" />
    </svg>
  )
}

export default function SummaryReport({ strings, lang, dims, session, participants, responses, moves, isFacilitator, onPrint, mode = 'live' }) {
  const nameById = {}
  participants.forEach((p) => { nameById[p.id] = p.name })
  const selectedIds = session.deep_dive_dimension_ids || []
  const solo = participants.length <= 1

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '10px 0 80px' }}>
      <div
        data-print-break=""
        style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', borderRadius: 'var(--ws-radius-lg)',
          background: 'linear-gradient(135deg, var(--ws-bg-deep) 0%, var(--ws-bg-elevated) 100%)', color: 'var(--ws-text-on-dark)', marginBottom: 22,
        }}
      >
        <SummitGlyph />
        <div>
          <div style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ws-brand-bright)' }}>{strings.wsSummaryComplete}</div>
          <div style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 20, marginTop: 3 }}>
            {strings.wsSummaryTitle}{session.company_name ? ` · ${session.company_name}` : ''}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 14.5, color: 'var(--ws-text-muted)', margin: '0 0 22px', maxWidth: '70ch' }}>{strings.wsSummaryIntro}</p>

      <div data-print-break="" style={{ border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-lg)', background: 'var(--ws-surface)', padding: 22, boxShadow: 'var(--ws-shadow-soft)' }}>
        <h3 style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 17, margin: '0 0 12px' }}>{solo ? strings.wsSummaryDivergenceSolo : strings.wsSummaryDivergence}</h3>
        <OverlayRadar strings={strings} lang={lang} dims={dims} participants={participants} emptyLabel={strings.wsNoPreworkYet} />
      </div>

      {mode === 'async' && !solo && (
        <div style={{ marginTop: 24 }}>
          <WorkshopInsight strings={strings} lang={lang} dims={dims} participants={participants} />
        </div>
      )}

      {mode !== 'async' && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 17, margin: '0 0 12px' }}>{strings.wsSummaryCaptured}</h3>
          {selectedIds.length === 0 && <p style={{ fontSize: 13.5, color: 'var(--ws-text-muted)', fontStyle: 'italic' }}>{strings.wsPickDimensions}</p>}
          {selectedIds.map((dimId) => {
            const dim = dims.find((d) => d.id === dimId)
            if (!dim) return null
            const ref = referenceStage(dim, participants)
            const nextStage = Math.min(ref + 1, 4)
            const caps = ref < 4 ? dim.capabilities.filter((c) => c.stage === nextStage) : []
            return (
              <div key={dimId} data-print-break="" style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{dimName(dim, lang)}</div>
                {caps.map((cap) => {
                  const forCap = responses.filter((r) => r.capability_id === cap.id && r.text.trim())
                  if (forCap.length === 0) return null
                  return (
                    <div key={cap.id} style={{ border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-sm)', background: 'var(--ws-bg-soft)', padding: 14, marginBottom: 10 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 8 }}>{capText(cap, lang)}</div>
                      {forCap.map((r) => (
                        <div key={r.id} style={{ fontSize: 12.5, lineHeight: 1.5, margin: '4px 0' }}>
                          <span style={{ color: participantColor(participants.findIndex((p) => p.id === r.participant_id)), fontFamily: 'var(--ws-font-mono)', fontSize: 10.5 }}>
                            {nameById[r.participant_id] || '?'} · {r.prompt_type}
                          </span>{' '}
                          <span style={{ color: 'var(--ws-text-primary)' }}>{r.text}</span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {mode !== 'async' && (
        <div data-print-break="" style={{ marginTop: 24 }}>
          <h3 style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 17, margin: '0 0 12px' }}>{strings.wsSummaryMoves}</h3>
          {moves.length === 0 ? <p style={{ fontSize: 13.5, color: 'var(--ws-text-muted)', fontStyle: 'italic' }}>{strings.wsSummaryNoMoves}</p> : <MoveBoard strings={strings} moves={moves} editable={false} />}
        </div>
      )}

      <p style={{ marginTop: 22, fontFamily: 'var(--ws-font-mono)', fontSize: 12.5, color: 'var(--ws-text-muted)' }}>
        {strings.wsSummaryRecheck(recheckDate(session.created_at, lang))}
      </p>

      {isFacilitator && (
        <div data-print-hide="" style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={onPrint} style={{ padding: '13px 22px', border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-sm)', background: 'var(--ws-surface)', color: 'var(--ws-text-primary)', fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 14 }}>
            {strings.wsPrint}
          </button>
          <button disabled title={strings.wsEmailStubNote} style={{ padding: '13px 22px', border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-sm)', background: 'var(--ws-bg-soft)', color: 'var(--ws-text-muted)', fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 14, cursor: 'not-allowed' }}>
            {strings.wsEmailStub}
          </button>
        </div>
      )}
      {isFacilitator && <p data-print-hide="" style={{ fontSize: 12, color: 'var(--ws-text-muted)', marginTop: 8 }}>{strings.wsEmailStubNote}</p>}
    </div>
  )
}
