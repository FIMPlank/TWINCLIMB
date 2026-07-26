import { useState } from 'react'
import { addMove } from '../api'

export default function MoveBoard({ strings, sessionId, moves, editable }) {
  const [desc, setDesc] = useState('')
  const [owner, setOwner] = useState('')
  const [timeframe, setTimeframe] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    if (!desc.trim() || busy) return
    setBusy(true)
    try {
      await addMove(sessionId, { description: desc.trim(), owner: owner.trim(), timeframe: timeframe.trim() })
      setDesc(''); setOwner(''); setTimeframe('')
    } finally {
      setBusy(false)
    }
  }

  const inputStyle = { flex: '1 1 160px', padding: '11px 13px', borderRadius: 'var(--ws-radius-sm)', border: '1.5px solid var(--ws-border-soft)', fontSize: 14, fontFamily: 'inherit' }

  return (
    <div>
      {moves.map((m, i) => (
        <div key={m.id} className="ws-animate-in" style={{ display: 'flex', gap: 16, alignItems: 'flex-start', border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-md)', background: 'var(--ws-surface)', padding: '16px 18px', marginBottom: 10 }}>
          <span aria-hidden="true" style={{ flex: 'none', width: 28, height: 28, borderRadius: '50%', background: 'var(--ws-brand)', color: 'var(--ws-ink-on-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ws-font-mono)', fontSize: 13, fontWeight: 700 }}>{i + 1}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{m.description}</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontFamily: 'var(--ws-font-mono)', fontSize: 11.5, color: 'var(--ws-text-muted)', flexWrap: 'wrap' }}>
              {m.owner && <span>{strings.wsMoveOwnerPlaceholder}: {m.owner}</span>}
              {m.timeframe && <span>{m.timeframe}</span>}
            </div>
          </div>
        </div>
      ))}

      {editable && moves.length < 3 && (
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={strings.wsMoveDescPlaceholder} style={{ ...inputStyle, flexBasis: 240 }} />
          <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder={strings.wsMoveOwnerPlaceholder} style={inputStyle} />
          <input value={timeframe} onChange={(e) => setTimeframe(e.target.value)} placeholder={strings.wsMoveTimeframePlaceholder} style={inputStyle} />
          <button type="submit" disabled={busy || !desc.trim()} style={{ padding: '11px 20px', border: 'none', borderRadius: 'var(--ws-radius-sm)', background: 'var(--ws-brand)', color: 'var(--ws-ink-on-brand)', fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 13.5 }}>
            {strings.wsAddMove}
          </button>
        </form>
      )}
      {editable && moves.length >= 3 && <p style={{ fontSize: 13, color: 'var(--ws-text-muted)', marginTop: 12 }}>{strings.wsMovesFull}</p>}
    </div>
  )
}
