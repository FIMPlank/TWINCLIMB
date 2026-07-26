// Who has finished the quick self-assessment — shared by the live
// workshop's "Set the scene" stage and the async check's collecting screen.
export default function ParticipantRollCall({ strings, participants, dimCount }) {
  const doneCount = participants.filter((p) => p.answers && Object.keys(p.answers).length === dimCount).length
  return (
    <div>
      <div style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ws-text-muted)', marginBottom: 14 }}>
        {strings.wsParticipantsLabel} · {doneCount}/{participants.length || 0}
      </div>
      {participants.length === 0 && <p style={{ fontSize: 14, color: 'var(--ws-text-muted)', fontStyle: 'italic' }}>{strings.wsParticipantsJoined(0)}</p>}
      {participants.map((p) => {
        const done = p.answers && Object.keys(p.answers).length === dimCount
        return (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid var(--ws-border-soft)' }}>
            <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: 6, background: done ? 'var(--ws-brand)' : 'var(--ws-surface)', border: `1.5px solid ${done ? 'var(--ws-brand)' : 'var(--ws-border-soft)'}`, color: 'var(--ws-ink-on-brand)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{done ? '✓' : ''}</span>
            <span style={{ fontSize: 14.5 }}>{p.name}</span>
            <span style={{ fontSize: 12, color: 'var(--ws-text-muted)' }}>{done ? strings.wsPreworkComplete : strings.wsPreworkPending}</span>
          </div>
        )
      })}
    </div>
  )
}
