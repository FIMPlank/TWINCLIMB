import { useEffect, useRef, useState } from 'react'
import { insertResponse, updateResponseText } from '../api'
import { participantColor } from './OverlayRadar'

function PromptColumn({ label, sessionId, dimensionId, capabilityId, promptType, participant, responses, participantIndex, reducedMotion }) {
  const mine = participant ? responses.find((r) => r.participant_id === participant.id) : null
  const others = responses.filter((r) => !participant || r.participant_id !== participant.id).filter((r) => r.text.trim())
  const [text, setText] = useState(mine?.text || '')
  const responseIdRef = useRef(mine?.id || null)
  const debounceRef = useRef(null)
  // ping newly-arrived bubbles (not the initial batch already on screen)
  const seenRef = useRef(new Set(others.map((r) => r.id)))
  const newIds = others.filter((r) => !seenRef.current.has(r.id)).map((r) => r.id)
  others.forEach((r) => seenRef.current.add(r.id))

  useEffect(() => {
    if (mine && !responseIdRef.current) responseIdRef.current = mine.id
  }, [mine])

  function handleChange(e) {
    const val = e.target.value
    setText(val)
    if (!participant) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (responseIdRef.current) {
        updateResponseText(responseIdRef.current, val).catch(() => {})
      } else {
        try {
          const row = await insertResponse({ sessionId, participantId: participant.id, dimensionId, capabilityId, promptType, text: val })
          responseIdRef.current = row.id
        } catch (err) {}
      }
    }, 400)
  }

  return (
    <div style={{ flex: '1 1 220px', minWidth: 200 }}>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--ws-text-faint)', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </div>
      {participant && (
        <textarea
          value={text} onChange={handleChange} rows={2}
          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: 8, border: '1.5px solid var(--ws-border-soft)', background: 'var(--ws-surface)', color: 'var(--ws-text-primary)', fontSize: 13.5, fontFamily: 'inherit', resize: 'vertical' }}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: participant ? 9 : 0 }}>
        {others.map((r) => (
          <div
            key={r.id}
            style={{
              border: '1px solid var(--ws-border-soft)', borderRadius: 8, background: 'var(--ws-surface)', padding: '8px 10px',
              animation: reducedMotion ? 'none' : newIds.includes(r.id) ? 'wsBubbleIn .25s ease-out, wsPing 1.4s ease-out' : 'none',
            }}
          >
            <div style={{ fontSize: 10.5, fontFamily: "'IBM Plex Mono',monospace", color: participantColor(participantIndex(r.participant_id)), marginBottom: 3 }}>
              {r.__name}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.4, color: 'var(--ws-text-primary)', whiteSpace: 'pre-wrap' }}>{r.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// All three prompts for one capability. `participant` present = editable
// (participant device); absent = read-only wall (facilitator display).
export default function CaptureWall({ strings, sessionId, dimensionId, capabilityId, capabilityLabel, participant, responses, participantIndex, reducedMotion }) {
  const forCap = responses.filter((r) => r.capability_id === capabilityId)
  const byPrompt = (pt) => forCap.filter((r) => r.prompt_type === pt)

  return (
    <div style={{ border: '1px solid var(--ws-border-soft)', borderRadius: 12, background: 'var(--ws-bg-soft)', padding: 18, marginBottom: 16 }}>
      <div style={{ fontSize: 14.5, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 4 }}>{capabilityLabel}</div>
      <style>{'@keyframes wsBubbleIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}@keyframes wsPing{0%{background:var(--ws-highlight-flash)}100%{background:var(--ws-surface)}}'}</style>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14 }}>
        <PromptColumn label={strings.wsPromptBlocker} sessionId={sessionId} dimensionId={dimensionId} capabilityId={capabilityId} promptType="blocker" participant={participant} responses={byPrompt('blocker')} participantIndex={participantIndex} reducedMotion={reducedMotion} />
        <PromptColumn label={strings.wsPromptOwner} sessionId={sessionId} dimensionId={dimensionId} capabilityId={capabilityId} promptType="owner" participant={participant} responses={byPrompt('owner')} participantIndex={participantIndex} reducedMotion={reducedMotion} />
        <PromptColumn label={strings.wsPromptVisible} sessionId={sessionId} dimensionId={dimensionId} capabilityId={capabilityId} promptType="visible_change" participant={participant} responses={byPrompt('visible_change')} participantIndex={participantIndex} reducedMotion={reducedMotion} />
      </div>
    </div>
  )
}
