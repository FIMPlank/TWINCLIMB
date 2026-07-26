// Small reusable stat chip for the facilitator bar and stage headers.
export default function MetricPill({ label, value, tone = 'default', dark = false }) {
  const toneColor = tone === 'warn' ? 'var(--ws-warn)' : dark ? 'var(--ws-brand-bright)' : 'var(--ws-brand-deep)'
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '6px 12px', borderRadius: 20,
        border: `1px solid ${dark ? 'var(--ws-border-on-dark)' : 'var(--ws-border-soft)'}`,
        background: dark ? 'rgba(244,247,242,0.04)' : 'var(--ws-surface)',
      }}
    >
      <span style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: dark ? 'var(--ws-text-muted-on-dark)' : 'var(--ws-text-muted)' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 13, fontWeight: 600, color: toneColor }}>{value}</span>
    </span>
  )
}
