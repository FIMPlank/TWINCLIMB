import { useEffect, useRef, useState } from 'react'
import { dimName } from '../../ttcmm'
import { runInterviewTurn } from '../aiApi'
import { insertResponse, addMove, updateParticipantAiInterview } from '../api'

// Builds the same {dimension -> next-stage capabilities} target set a live
// facilitator's DeepDiveView shows via CaptureWall, from the group's own
// self-assessment (min score across participants = reference stage) -- so
// the AI asks about exactly what a human facilitator would have picked.
function buildTargets(dims, dimIds, participants, lang) {
  return dimIds
    .map((id) => {
      const dim = dims.find((d) => d.id === id)
      if (!dim) return null
      const vals = participants.map((p) => p.answers?.[id]).filter((v) => v !== undefined && v !== null)
      const ref = vals.length ? Math.min(...vals) : 0
      const nextStage = Math.min(ref + 1, 4)
      const caps = dim.capabilities.filter((c) => c.stage === nextStage)
      return { dimensionId: id, dimensionName: dimName(dim, lang), capabilities: caps.map((c) => ({ id: c.id, text: lang === 'de' ? c.text_de : c.text })) }
    })
    .filter((t) => t && t.capabilities.length > 0)
}

function Bubble({ role, text }) {
  const mine = role === 'participant'
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      <div
        style={{
          maxWidth: '80%', padding: '11px 14px', borderRadius: 'var(--ws-radius-md)', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap',
          background: mine ? 'var(--ws-brand)' : 'var(--ws-surface)', color: mine ? 'var(--ws-ink-on-brand)' : 'var(--ws-text-primary)',
          border: mine ? 'none' : '1px solid var(--ws-border-soft)',
        }}
      >
        {text}
      </div>
    </div>
  )
}

export default function AiInterviewChat({ strings, lang, dims, session, participant, participants, sessionId, reducedMotion }) {
  const dimIds = session.deep_dive_dimension_ids || []
  const targets = buildTargets(dims, dimIds, participants, lang)
  const [transcript, setTranscript] = useState(participant.ai_interview || [])
  const [done, setDone] = useState(!!participant.ai_interview_done)
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const bottomRef = useRef(null)
  const startedRef = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' })
  }, [transcript, reducedMotion])

  useEffect(() => {
    if (done || startedRef.current || targets.length === 0) return
    const last = transcript[transcript.length - 1]
    if (!last || last.role === 'participant') {
      startedRef.current = true
      requestTurn(transcript)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function requestTurn(nextTranscript) {
    setBusy(true)
    setErrorMsg('')
    try {
      const result = await runInterviewTurn({
        lang, participantName: participant.name, companyName: session.company_name, contextNote: session.context_note, targets, transcript: nextTranscript,
      })
      if (result.done) {
        for (const r of result.responses || []) {
          await insertResponse({ sessionId, participantId: participant.id, dimensionId: r.dimensionId, capabilityId: r.capabilityId, promptType: r.promptType, text: r.text, aiGenerated: true })
        }
        if (result.move?.description) {
          await addMove(sessionId, { dimensionId: result.move.dimensionId || targets[0]?.dimensionId, description: result.move.description, owner: result.move.owner || '', timeframe: result.move.timeframe || '', aiGenerated: true })
        }
        const finalTranscript = [...nextTranscript, { role: 'facilitator', text: result.narrative || strings.wsAiInterviewDoneNote }]
        setTranscript(finalTranscript)
        setDone(true)
        await updateParticipantAiInterview(participant.id, finalTranscript, true)
      } else {
        const withQuestion = [...nextTranscript, { role: 'facilitator', text: result.question }]
        setTranscript(withQuestion)
        await updateParticipantAiInterview(participant.id, withQuestion, false)
      }
    } catch (err) {
      setErrorMsg(String(err.message || err))
    } finally {
      setBusy(false)
      startedRef.current = false
    }
  }

  async function submitReply(e) {
    e.preventDefault()
    if (!reply.trim() || busy) return
    const next = [...transcript, { role: 'participant', text: reply.trim() }]
    setTranscript(next)
    setReply('')
    await updateParticipantAiInterview(participant.id, next, false)
    requestTurn(next)
  }

  const awaitingReply = !done && !busy && transcript.length > 0 && transcript[transcript.length - 1].role === 'facilitator'

  if (targets.length === 0) {
    return <p style={{ fontSize: 14, color: 'var(--ws-text-muted)', fontStyle: 'italic' }}>{strings.wsAiInterviewWaiting}</p>
  }

  return (
    <div style={{ border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-lg)', background: 'var(--ws-bg-soft)', padding: 20 }}>
      <div style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ws-brand-deep)', marginBottom: 12 }}>
        {strings.wsAiInterviewBadge}
      </div>
      <div>
        {transcript.map((t, i) => <Bubble key={i} role={t.role} text={t.text} />)}
        {busy && <Bubble role="facilitator" text={strings.wsAiInterviewThinking} />}
        <div ref={bottomRef} />
      </div>
      {errorMsg && <p style={{ color: 'var(--ws-danger)', fontSize: 13, marginTop: 6 }}>{errorMsg}</p>}
      {awaitingReply && (
        <form onSubmit={submitReply} style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input
            value={reply} onChange={(e) => setReply(e.target.value)} placeholder={strings.wsAiInterviewReplyPlaceholder} autoFocus
            style={{ flex: 1, padding: '11px 13px', borderRadius: 'var(--ws-radius-sm)', border: '1.5px solid var(--ws-border-soft)', background: 'var(--ws-surface)', color: 'var(--ws-text-primary)', fontSize: 14, fontFamily: 'inherit' }}
          />
          <button type="submit" disabled={!reply.trim()} style={{ padding: '11px 20px', border: 'none', borderRadius: 'var(--ws-radius-sm)', background: 'var(--ws-brand)', color: 'var(--ws-ink-on-brand)', fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 13.5, opacity: reply.trim() ? 1 : 0.5 }}>
            {strings.wsAiInterviewSend}
          </button>
        </form>
      )}
      {done && <p style={{ fontSize: 13, color: 'var(--ws-text-muted)', marginTop: 12 }}>{strings.wsAiInterviewComplete}</p>}
    </div>
  )
}
