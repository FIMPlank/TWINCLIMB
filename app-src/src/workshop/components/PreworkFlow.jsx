import { useState } from 'react'
import { DIMENSIONS } from '../../ttcmm'
import DimensionView from '../../components/DimensionView'
import { setParticipantAnswer, setParticipantPreworkNote } from '../api'

// Reuses the self-assessment's DimensionView as-is (quick pick + optional
// capability drill-down) and adds one free-text prompt per dimension.
// Every pick/note writes through immediately, so a closed tab never loses
// progress — there is no separate "save" step, only "done".
export default function PreworkFlow({ strings, lang, participant, onParticipantUpdate }) {
  const [idx, setIdx] = useState(0)
  const [deepOpen, setDeepOpen] = useState({})
  const [caps, setCaps] = useState({})
  const [note, setNote] = useState(participant.prework_notes?.[DIMENSIONS[idx]?.id] || '')
  const [done, setDone] = useState(Object.keys(participant.answers || {}).length === DIMENSIONS.length)

  const dim = DIMENSIONS[idx]
  const sel = participant.answers?.[dim.id] ?? 0

  function goTo(nextIdx) {
    setIdx(nextIdx)
    setNote(participant.prework_notes?.[DIMENSIONS[nextIdx]?.id] || '')
  }

  async function handleSelectStage(dimId, val) {
    const answers = await setParticipantAnswer(participant, dimId, val)
    onParticipantUpdate({ ...participant, answers })
  }

  async function handleNoteChange(e) {
    const text = e.target.value
    setNote(text)
    const prework_notes = await setParticipantPreworkNote(participant, dim.id, text)
    onParticipantUpdate({ ...participant, prework_notes })
  }

  if (done) {
    return (
      <div style={{ maxWidth: 560, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--ws-text-muted)' }}>{strings.wsPreworkDone}</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 32px 0' }}>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, margin: '0 0 4px' }}>{strings.wsPreworkTitle}</h2>
        <p style={{ fontSize: 13.5, color: 'var(--ws-text-muted)', maxWidth: '64ch' }}>{strings.wsPreworkIntro}</p>
      </div>

      {/* DimensionView is reused as-is from the self-assessment app and
          reads its own --as-* theme variables, which are otherwise
          undefined inside .ws-root -- scope one here so it picks up the
          same light/dark theme instead of silently falling back to
          transparent/inherited styling. min-height/background override the
          .as-root class rule, which is meant for a full page, not an inline
          island. */}
      <div className="as-root" style={{ minHeight: 'auto', background: 'transparent' }}>
        <DimensionView
          strings={idx === DIMENSIONS.length - 1 ? { ...strings, seeResults: strings.wsPreworkSubmit } : strings}
          lang={lang} dim={dim} idx={idx} sel={sel}
          caps={caps} deepOpen={!!deepOpen[dim.id]} isDeep={false} derivedStage={0}
          onSelectStage={handleSelectStage}
          onSetCap={(cid, val) => setCaps((c) => ({ ...c, [cid]: val }))}
          onToggleDeep={() => setDeepOpen((s) => ({ ...s, [dim.id]: !s[dim.id] }))}
          onBack={() => goTo(Math.max(0, idx - 1))}
          onNext={() => {
            if (idx === DIMENSIONS.length - 1) setDone(true)
            else goTo(idx + 1)
          }}
          clientSuffix=""
        />
      </div>

      <div style={{ maxWidth: 1200, margin: '-10px auto 40px', padding: '0 32px' }}>
        <label style={{ display: 'block', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: '0.08em', color: 'var(--ws-text-faint)', textTransform: 'uppercase', marginBottom: 8 }}>
          {strings.wsPreworkPrompt}
        </label>
        <textarea
          value={note} onChange={handleNoteChange} rows={2} placeholder={strings.wsPreworkNotePlaceholder}
          style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 8, border: '1.5px solid var(--ws-border-soft)', background: 'var(--ws-surface)', color: 'var(--ws-text-primary)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }}
        />
      </div>
    </div>
  )
}
