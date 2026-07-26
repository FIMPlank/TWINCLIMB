import MetricPill from './MetricPill'

function PhaseTimer({ strings, phase, phaseMinutes, seconds }) {
  const budget = phaseMinutes && phaseMinutes[phase]
  if (budget == null) return null
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return <MetricPill dark label={strings.wsPhaseElapsedLabel} value={`${mm}:${ss} / ${budget}m`} tone={seconds > budget * 60 ? 'warn' : 'default'} />
}

// Only controls the existing app actually supports: join code/copy,
// participant count, elapsed time against the session's own phase budget,
// and phase navigation. No lock/reveal toggle — that state doesn't exist.
export default function FacilitatorBar({ strings, session, participantCount, elapsedSeconds, copied, onCopyLink, onPrevPhase, onNextPhase, canGoPrev, canGoNext }) {
  return (
    <div
      data-print-hide=""
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '14px 28px', background: 'var(--ws-surface-dark)', color: 'var(--ws-text-on-dark)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={onCopyLink}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 13px', border: '1px solid var(--ws-border-on-dark)', borderRadius: 20, background: 'transparent', color: 'var(--ws-text-on-dark)', fontSize: 13, fontFamily: 'var(--ws-font-mono)' }}
        >
          <span style={{ fontWeight: 700, letterSpacing: '0.1em' }}>{session.code}</span>
          <span style={{ color: 'var(--ws-text-muted-on-dark)' }}>{copied ? strings.wsCopyLinkDone : strings.wsCopyLink}</span>
        </button>
        <MetricPill dark label={strings.wsParticipantsLabel} value={participantCount} />
        {session.company_name && <span style={{ fontSize: 13.5, fontWeight: 600 }}>{session.company_name}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <PhaseTimer strings={strings} phase={session.phase} phaseMinutes={session.phase_minutes} seconds={elapsedSeconds} />
        <button onClick={onPrevPhase} disabled={!canGoPrev} aria-label={strings.wsPreviousPhase} style={{ padding: '9px 14px', border: '1px solid var(--ws-border-on-dark)', borderRadius: 'var(--ws-radius-sm)', background: 'transparent', color: 'var(--ws-text-on-dark)', fontSize: 13, fontFamily: 'var(--ws-font-head)', fontWeight: 600, opacity: canGoPrev ? 1 : 0.35 }}>
          {strings.wsPreviousPhase}
        </button>
        <button onClick={onNextPhase} disabled={!canGoNext} style={{ padding: '9px 18px', border: 'none', borderRadius: 'var(--ws-radius-sm)', background: 'var(--ws-brand-bright)', color: 'var(--ws-ink-on-brand-bright)', fontSize: 13, fontFamily: 'var(--ws-font-head)', fontWeight: 700, opacity: canGoNext ? 1 : 0.35 }}>
          {strings.wsNextPhase}
        </button>
      </div>
    </div>
  )
}
