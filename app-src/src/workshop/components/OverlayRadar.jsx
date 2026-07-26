import { radarGeometry } from '../../radar'
import { dimName } from '../../ttcmm'
import { DIM_SHORT_NAME } from '../../i18n'

// Distinct from ttcmm's per-dimension PALETTE — this cycles per participant.
const PARTICIPANT_COLORS = ['#179C7D', '#1F6FB2', '#C0562F', '#7A5CA8', '#B07D00', '#B0417E', '#2E9E9E', '#8C4B2F', '#4A6FA5', '#9A6B3D']

export function participantColor(i) {
  return PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length]
}

// One radar, one line per participant — divergence is the point, not an average.
export default function OverlayRadar({ strings, lang, dims, participants, emptyLabel }) {
  const RN = DIM_SHORT_NAME[lang]
  const n = dims.length
  const withAnswers = participants.filter((p) => p.answers && Object.keys(p.answers).length > 0)

  if (withAnswers.length === 0) {
    return <p style={{ fontSize: 14, color: 'var(--ws-text-faint)', fontStyle: 'italic' }}>{emptyLabel}</p>
  }

  const base = radarGeometry(dims.map(() => 0), n)
  const labels = RN.map((nm, i) => {
    const [x, y] = base.pt(base.R + 24, i)
    let anchor = 'middle'
    if (x > base.cx + 4) anchor = 'start'
    else if (x < base.cx - 4) anchor = 'end'
    return { x: x.toFixed(1), y: y.toFixed(1), name: nm, anchor }
  })

  return (
    <div>
      <svg viewBox="0 0 440 400" width="100%" style={{ maxWidth: 480, display: 'block', margin: '0 auto' }}>
        {base.rings.map((r, i) => <polygon key={i} points={r.points} fill="none" stroke="var(--ws-chart-ring)" strokeWidth="1" />)}
        {base.axes.map((a, i) => <line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke="var(--ws-chart-axis)" strokeWidth="1" />)}
        {withAnswers.map((p, pi) => {
          const vals = dims.map((d) => Number(p.answers[d.id]) || 0)
          const g = radarGeometry(vals, n)
          const color = participantColor(pi)
          return <polygon key={p.id} points={g.points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" opacity="0.85" />
        })}
        {labels.map((l, i) => (
          <text key={i} x={l.x} y={l.y} textAnchor={l.anchor} dominantBaseline="middle" fontFamily="IBM Plex Mono" fontSize="11" fill="var(--ws-text-muted)">{l.name}</text>
        ))}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', justifyContent: 'center', marginTop: 12 }}>
        {withAnswers.map((p, pi) => (
          <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ws-text-primary)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: participantColor(pi), display: 'inline-block' }} />
            {p.name}
          </span>
        ))}
      </div>
    </div>
  )
}
