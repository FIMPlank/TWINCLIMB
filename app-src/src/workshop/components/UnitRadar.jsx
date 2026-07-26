import { radarGeometry } from '../../radar'
import { PALETTE } from '../../ttcmm'
import { DIM_SHORT_NAME } from '../../i18n'

// One filled polygon for a rolled-up unit's per-dimension stages -- same
// visual language as the self-assessment's own results radar, just fed a
// {dimId: stage|null} map instead of a single participant's answers.
export default function UnitRadar({ lang, dims, stages, size = 230, showLabels = true, emptyLabel }) {
  const n = dims.length
  const vals = dims.map((d) => stages[d.id])
  const hasAny = vals.some((v) => v !== null && v !== undefined)
  if (!hasAny) return <p style={{ fontSize: 13, color: 'var(--ws-text-faint)', fontStyle: 'italic', margin: 0 }}>{emptyLabel}</p>

  const g = radarGeometry(vals.map((v) => v ?? 0), n)
  const RN = DIM_SHORT_NAME[lang]
  const labels = showLabels
    ? RN.map((nm, i) => {
        const [x, y] = g.pt(g.R + 22, i)
        let anchor = 'middle'
        if (x > g.cx + 4) anchor = 'start'
        else if (x < g.cx - 4) anchor = 'end'
        return { x: x.toFixed(1), y: y.toFixed(1), name: nm, anchor }
      })
    : []

  return (
    <svg viewBox="0 0 440 400" width="100%" height={size} style={{ display: 'block', margin: '0 auto' }}>
      {g.rings.map((r, i) => <polygon key={i} points={r.points} fill="none" stroke="var(--ws-chart-ring)" strokeWidth="1" />)}
      {g.axes.map((a, i) => <line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke="var(--ws-chart-axis)" strokeWidth="1" />)}
      <polygon points={g.points} fill="var(--ws-brand-tint-fill)" stroke="var(--ws-brand)" strokeWidth="2" strokeLinejoin="round" />
      {g.verts.map((v, i) => (vals[i] !== null && vals[i] !== undefined ? <circle key={i} cx={v.x} cy={v.y} r="4" fill={PALETTE[i]} stroke="var(--ws-surface)" strokeWidth="1.3" /> : null))}
      {labels.map((l, i) => (
        <text key={i} x={l.x} y={l.y} textAnchor={l.anchor} dominantBaseline="middle" fontFamily="IBM Plex Mono" fontSize="10" fill="var(--ws-text-muted)">{l.name}</text>
      ))}
    </svg>
  )
}
