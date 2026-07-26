import { PALETTE, dimName, capText } from '../../ttcmm'
import CaptureWall from './CaptureWall'

function referenceStage(dim, participants) {
  const vals = participants.map((p) => p.answers?.[dim.id]).filter((v) => v !== undefined && v !== null)
  return vals.length ? Math.min(...vals) : 0
}

export default function DeepDiveView({ strings, lang, dims, session, participants, responses, participant, sessionId, isFacilitator, onToggleDimension, reducedMotion }) {
  const selectedIds = session.deep_dive_dimension_ids || []
  const nameById = {}
  const idxById = {}
  participants.forEach((p, i) => { nameById[p.id] = p.name; idxById[p.id] = i })
  const participantIndex = (pid) => idxById[pid] ?? 0
  const enriched = responses.map((r) => ({ ...r, __name: nameById[r.participant_id] || '?' }))

  return (
    <div>
      {isFacilitator && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
          {dims.map((d, i) => {
            const on = selectedIds.includes(d.id)
            const disabled = !on && selectedIds.length >= 2
            return (
              <button
                key={d.id} onClick={() => !disabled && onToggleDimension(d.id)} disabled={disabled}
                style={{
                  padding: '9px 14px', borderRadius: 20, fontSize: 13, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
                  border: `1.5px solid ${on ? PALETTE[i] : 'var(--ws-border-soft)'}`, background: on ? PALETTE[i] : 'var(--ws-surface)', color: on ? '#fff' : disabled ? 'var(--ws-text-faint)' : 'var(--ws-text-primary)', opacity: disabled ? 0.55 : 1,
                }}
              >
                {dimName(d, lang)}
              </button>
            )
          })}
        </div>
      )}

      {selectedIds.length === 0 && <p style={{ fontSize: 14, color: 'var(--ws-text-faint)', fontStyle: 'italic' }}>{strings.wsPickDimensions}</p>}

      {selectedIds.map((dimId) => {
        const dim = dims.find((d) => d.id === dimId)
        if (!dim) return null
        const ref = referenceStage(dim, participants)
        const nextStage = ref + 1
        const caps = nextStage <= 4 ? dim.capabilities.filter((c) => c.stage === nextStage) : []
        return (
          <div key={dimId} style={{ marginBottom: 30 }}>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 18, margin: '0 0 4px' }}>{dimName(dim, lang)}</h3>
            <p style={{ fontSize: 12.5, fontFamily: "'IBM Plex Mono',monospace", color: 'var(--ws-text-faint)', margin: '0 0 14px' }}>
              {strings.stageN(ref)} → {strings.stageN(Math.min(nextStage, 4))}
            </p>
            {caps.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--ws-text-faint)', fontStyle: 'italic' }}>{strings.wsNoCapabilitiesAtNextStage}</p>
            ) : (
              caps.map((cap) => (
                <CaptureWall
                  key={cap.id} strings={strings} sessionId={sessionId} dimensionId={dimId} capabilityId={cap.id}
                  capabilityLabel={capText(cap, lang)} participant={participant} responses={enriched}
                  participantIndex={participantIndex} reducedMotion={reducedMotion}
                />
              ))
            )}
          </div>
        )
      })}
    </div>
  )
}
