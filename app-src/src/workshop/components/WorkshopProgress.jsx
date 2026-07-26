// Maps the 6 underlying session phases onto a 5-stage rail. prioritization
// and summary share the final "Commit" stage — the phase value itself is
// never renamed, only this visual label.
const STAGE_INDEX = { prework: 0, opening: 1, calibration: 2, deepdive: 3, prioritization: 4, summary: 4 }

export default function WorkshopProgress({ strings, phase }) {
  const labels = [strings.wsStageScene, strings.wsStageCompare, strings.wsStageAssess, strings.wsStageDiscuss, strings.wsStageCommit]
  const current = STAGE_INDEX[phase] ?? 0

  return (
    <nav aria-label={strings.wsStageNavLabel} data-print-hide="" style={{ padding: '16px 28px', background: 'var(--ws-bg-elevated)' }}>
      <ol className="ws-progress-rail" style={{ display: 'flex', alignItems: 'flex-start', listStyle: 'none', margin: '0 auto', padding: 0, maxWidth: 980 }}>
        {labels.map((label, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'upcoming'
          return (
            <li key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minWidth: 84 }}>
              {i > 0 && (
                <span
                  aria-hidden="true"
                  style={{ position: 'absolute', top: 15, right: '50%', width: '100%', height: 2, background: i <= current ? 'var(--ws-brand-muted)' : 'var(--ws-border-on-dark)', zIndex: 0 }}
                />
              )}
              <span
                aria-hidden="true"
                style={{
                  position: 'relative', zIndex: 1, width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--ws-font-mono)', fontSize: 12, fontWeight: 600,
                  background: state === 'upcoming' ? 'transparent' : state === 'current' ? 'var(--ws-brand-bright)' : 'var(--ws-brand-muted)',
                  border: state === 'upcoming' ? '1.5px solid var(--ws-border-on-dark)' : 'none',
                  color: state === 'upcoming' ? 'var(--ws-text-muted-on-dark)' : 'var(--ws-ink-on-brand-bright)',
                }}
              >
                {state === 'done' ? '✓' : i + 1}
              </span>
              <span
                style={{
                  marginTop: 8, fontSize: 12.5, fontFamily: 'var(--ws-font-body)', textAlign: 'center', lineHeight: 1.3,
                  color: state === 'current' ? 'var(--ws-text-on-dark)' : 'var(--ws-text-muted-on-dark)', fontWeight: state === 'current' ? 600 : 400,
                }}
              >
                {label}
                {state === 'current' && <span className="ws-sr-only"> — {strings.wsStageCurrentSuffix}</span>}
              </span>
            </li>
          )
        })}
      </ol>

      <div className="ws-progress-compact" style={{ alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--ws-border-on-dark)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((current + 1) / labels.length) * 100}%`, background: 'var(--ws-brand-bright)', transition: 'width 240ms ease-out' }} />
        </div>
        <span style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 11.5, color: 'var(--ws-text-muted-on-dark)', whiteSpace: 'nowrap' }}>
          {strings.wsStageOf(current + 1, labels.length)} · {labels[current]}
        </span>
      </div>
    </nav>
  )
}
