import { useState } from 'react'
import { radarGeometry } from '../../radar'
import { DIM_SHORT_NAME } from '../../i18n'
import { participantColor } from './OverlayRadar'

const BAND_COLOR = 'var(--ws-brand-tint-fill)'

// The "Compare" stage centerpiece: a large presentation-scale radar with an
// individual (one line per participant) / group (average + min-max band)
// toggle, a legend, spread stats, and a plain-text accessible equivalent —
// all derived directly from participants.answers, nothing invented.
export default function RadarPresentation({ strings, lang, dims, participants, emptyLabel }) {
  const [mode, setMode] = useState('individual')
  const n = dims.length
  const withAnswers = participants.filter((p) => p.answers && Object.keys(p.answers).length > 0)

  if (withAnswers.length === 0) {
    return <p style={{ fontSize: 15, color: 'var(--ws-text-muted)', fontStyle: 'italic' }}>{emptyLabel}</p>
  }

  const perDim = dims.map((d) => {
    const vals = withAnswers.map((p) => Number(p.answers[d.id]) || 0)
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    return { id: d.id, avg, min: Math.min(...vals), max: Math.max(...vals) }
  })

  const base = radarGeometry(dims.map(() => 0), n)
  const RN = DIM_SHORT_NAME[lang]
  const labels = RN.map((nm, i) => {
    const [x, y] = base.pt(base.R + 30, i)
    let anchor = 'middle'
    if (x > base.cx + 4) anchor = 'start'
    else if (x < base.cx - 4) anchor = 'end'
    return { x: x.toFixed(1), y: y.toFixed(1), name: nm, anchor }
  })

  const avgGeom = radarGeometry(perDim.map((d) => d.avg), n)
  const minGeom = radarGeometry(perDim.map((d) => d.min), n)
  const maxGeom = radarGeometry(perDim.map((d) => d.max), n)
  const bandPoints = `${maxGeom.points} ${minGeom.points.split(' ').reverse().join(' ')}`

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 6 }} role="group" aria-label={strings.wsCompareModeLabel}>
        {['individual', 'group'].map((m) => (
          <button
            key={m} onClick={() => setMode(m)} aria-pressed={mode === m}
            style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 13, fontFamily: 'var(--ws-font-head)', fontWeight: 600, cursor: 'pointer',
              border: `1.5px solid ${mode === m ? 'var(--ws-brand)' : 'var(--ws-border-soft)'}`,
              background: mode === m ? 'var(--ws-brand)' : 'var(--ws-surface)', color: mode === m ? 'var(--ws-ink-on-brand)' : 'var(--ws-text-primary)',
            }}
          >
            {m === 'individual' ? strings.wsCompareIndividual : strings.wsCompareGroup}
          </button>
        ))}
      </div>

      <svg viewBox="0 0 440 400" width="100%" role="img" aria-labelledby="ws-radar-title" style={{ maxWidth: 620, display: 'block', margin: '0 auto' }}>
        <title id="ws-radar-title">{strings.wsRadarAccessibleTitle}</title>
        {base.rings.map((r, i) => <polygon key={i} points={r.points} fill="none" stroke="var(--ws-border-soft)" strokeWidth="1" />)}
        {base.axes.map((a, i) => <line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke="var(--ws-border-soft)" strokeWidth="1" />)}

        {mode === 'individual' &&
          withAnswers.map((p, pi) => {
            const vals = dims.map((d) => Number(p.answers[d.id]) || 0)
            const g = radarGeometry(vals, n)
            return <polygon key={p.id} points={g.points} fill="none" stroke={participantColor(pi)} strokeWidth="2.5" strokeLinejoin="round" opacity="0.88" />
          })}

        {mode === 'group' && (
          <>
            <polygon points={bandPoints} fill={BAND_COLOR} stroke="none" />
            <polygon points={avgGeom.points} fill="none" stroke="var(--ws-brand)" strokeWidth="3" strokeLinejoin="round" />
          </>
        )}

        {labels.map((l, i) => (
          <text key={i} x={l.x} y={l.y} textAnchor={l.anchor} dominantBaseline="middle" fontFamily="IBM Plex Mono" fontSize="13" fill="var(--ws-text-muted)">{l.name}</text>
        ))}
      </svg>

      {mode === 'individual' ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', justifyContent: 'center', marginTop: 14 }}>
          {withAnswers.map((p, pi) => (
            <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--ws-text-primary)' }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: participantColor(pi), display: 'inline-block' }} />
              {p.name}
            </span>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', fontFamily: 'var(--ws-font-mono)', fontSize: 13, color: 'var(--ws-text-muted)', marginTop: 14 }}>
          {strings.wsCompareGroupLegend}
        </p>
      )}

      <details style={{ marginTop: 18, maxWidth: 480, marginInline: 'auto' }}>
        <summary style={{ fontSize: 12.5, color: 'var(--ws-text-muted)', cursor: 'pointer' }}>{strings.wsRadarTableToggle}</summary>
        <table style={{ width: '100%', marginTop: 10, fontSize: 13, borderCollapse: 'collapse' }}>
          <caption className="ws-sr-only">{strings.wsRadarAccessibleTitle}</caption>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--ws-text-muted)' }}>{strings.dimensionLabel}</th>
              <th scope="col" style={{ textAlign: 'right', padding: '4px 8px', color: 'var(--ws-text-muted)' }}>{strings.avgDimension}</th>
              <th scope="col" style={{ textAlign: 'right', padding: '4px 8px', color: 'var(--ws-text-muted)' }}>{strings.wsSpreadLabel}</th>
            </tr>
          </thead>
          <tbody>
            {perDim.map((d, i) => (
              <tr key={d.id} style={{ borderTop: '1px solid var(--ws-border-soft)' }}>
                <td style={{ padding: '5px 8px' }}>{RN[i]}</td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'var(--ws-font-mono)' }}>{d.avg.toFixed(1)}</td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'var(--ws-font-mono)' }}>{d.min}–{d.max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
