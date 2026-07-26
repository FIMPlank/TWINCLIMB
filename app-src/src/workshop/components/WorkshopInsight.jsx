import { dimName } from '../../ttcmm'

// Derives facilitation prompts directly from participants.answers — no
// metric here is anything other than avg/min/max per dimension, computed
// live. Renders nothing if there isn't enough data to derive honestly.
export default function WorkshopInsight({ strings, lang, dims, participants }) {
  const withAnswers = participants.filter((p) => p.answers && Object.keys(p.answers).length > 0)
  if (withAnswers.length === 0) return null

  const perDim = dims.map((d, i) => {
    const vals = withAnswers.map((p) => Number(p.answers[d.id]) || 0)
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    return { idx: i, id: d.id, name: dimName(d, lang), avg, min: Math.min(...vals), max: Math.max(...vals), spread: Math.max(...vals) - Math.min(...vals) }
  })

  const strongest = perDim.reduce((a, b) => (b.avg > a.avg ? b : a))
  const weakest = perDim.reduce((a, b) => (b.avg < a.avg ? b : a))
  const mostAligned = perDim.reduce((a, b) => (b.spread < a.spread ? b : a))
  const mostDisagreement = perDim.reduce((a, b) => (b.spread > a.spread ? b : a))
  const largestGap = perDim.reduce((a, b) => (4 - b.avg > 4 - a.avg ? b : a))

  const cards = [
    { label: strings.wsInsightStrongest, dim: strongest, value: strongest.avg.toFixed(1), prompt: strings.wsInsightStrongestPrompt(strongest.name) },
    { label: strings.wsInsightWeakest, dim: weakest, value: weakest.avg.toFixed(1), prompt: strings.wsInsightWeakestPrompt(weakest.name) },
    { label: strings.wsInsightAligned, dim: mostAligned, value: mostAligned.spread === 0 ? strings.wsInsightNoSpread : `${mostAligned.min}–${mostAligned.max}`, prompt: strings.wsInsightAlignedPrompt(mostAligned.name) },
    { label: strings.wsInsightDisagreement, dim: mostDisagreement, value: `${mostDisagreement.min}–${mostDisagreement.max}`, prompt: strings.wsInsightDisagreementPrompt(mostDisagreement.name), hide: mostDisagreement.spread === 0 },
    { label: strings.wsInsightGap, dim: largestGap, value: `+${(4 - largestGap.avg).toFixed(1)}`, prompt: strings.wsInsightGapPrompt(largestGap.name) },
  ].filter((c) => !c.hide)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: 28 }}>
      {cards.map((c) => (
        <div key={c.label} style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-md)', padding: '18px 20px', boxShadow: 'var(--ws-shadow-soft)' }}>
          <div style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ws-text-muted)' }}>{c.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
            <span style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 22 }}>{c.dim.name}</span>
            <span style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 14, color: 'var(--ws-brand-deep)', fontWeight: 600 }}>{c.value}</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ws-text-muted)', margin: '8px 0 0' }}>{c.prompt}</p>
        </div>
      ))}
    </div>
  )
}
