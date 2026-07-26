import { participantColor } from './OverlayRadar'

// Per-dimension spread of quick-pick scores across the room — a dot strip,
// not an average, so a 0-vs-4 split reads as clearly as a tight cluster.
export default function SpreadChart({ strings, dimension, participants, color }) {
  const withAnswers = participants.filter((p) => p.answers && p.answers[dimension.id] !== undefined)
  const vals = withAnswers.map((p) => Number(p.answers[dimension.id]) || 0)
  const min = vals.length ? Math.min(...vals) : 0
  const max = vals.length ? Math.max(...vals) : 0

  return (
    <div>
      <div style={{ position: 'relative', height: 64, marginTop: 18 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 30, height: 2, background: 'var(--ws-border-soft)' }} />
        {[0, 1, 2, 3, 4].map((s) => (
          <div key={s} style={{ position: 'absolute', top: 22, left: `${(s / 4) * 100}%`, transform: 'translateX(-50%)', width: 2, height: 18, background: 'var(--ws-border-soft)' }} />
        ))}
        {[0, 1, 2, 3, 4].map((s) => (
          <div key={`n${s}`} style={{ position: 'absolute', top: 44, left: `${(s / 4) * 100}%`, transform: 'translateX(-50%)', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--ws-text-faint)' }}>{s}</div>
        ))}
        {withAnswers.map((p, i) => {
          const v = Number(p.answers[dimension.id]) || 0
          // small deterministic jitter so identical scores don't fully overlap
          const jitter = ((i % 5) - 2) * 3
          return (
            <div
              key={p.id}
              title={`${p.name}: ${v}`}
              style={{
                position: 'absolute', top: 30 + jitter, left: `${(v / 4) * 100}%`, transform: 'translate(-50%,-50%)',
                width: 14, height: 14, borderRadius: '50%', background: color || participantColor(i),
                border: '2px solid var(--ws-surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
              }}
            />
          )
        })}
      </div>
      <div style={{ marginTop: 26, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: 'var(--ws-text-muted)' }}>
        {vals.length === 0 ? `${strings.wsSpreadLabel}: —` : withAnswers.length === 1 ? `${strings.wsScoreLabel}: ${min}` : `${strings.wsSpreadLabel}: ${min}–${max}`} · {strings.wsParticipantCount(withAnswers.length)}
      </div>
    </div>
  )
}
