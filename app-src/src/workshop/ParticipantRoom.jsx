import { useState } from 'react'
import { DIMENSIONS, dimName, PALETTE } from '../ttcmm'
import { useWorkshopSession } from './useWorkshopSession'
import { usePrefersReducedMotion } from './hooks'
import WorkshopProgress from './components/WorkshopProgress'
import ParticipantStatus from './components/ParticipantStatus'
import RadarPresentation from './components/RadarPresentation'
import WorkshopInsight from './components/WorkshopInsight'
import SpreadChart from './components/SpreadChart'
import DeepDiveView from './components/DeepDiveView'
import MoveBoard from './components/MoveBoard'
import SummaryReport from './components/SummaryReport'
import PreworkFlow from './components/PreworkFlow'

const cardStyle = { background: 'var(--ws-surface)', border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-lg)', boxShadow: 'var(--ws-shadow-soft)', padding: 22 }
const h2Style = { fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 'clamp(21px,5vw,26px)', margin: '0 0 6px' }
const bodyMuted = { fontSize: 14, lineHeight: 1.55, color: 'var(--ws-text-muted)', marginBottom: 18 }

export default function ParticipantRoom({ strings, lang, participant: initialParticipant }) {
  const [participant, setParticipant] = useState(initialParticipant)
  const { session, participants, responses, moves, loading, error } = useWorkshopSession(participant.sessionId)
  const reducedMotion = usePrefersReducedMotion()

  if (loading) return <p style={{ padding: 60, color: 'var(--ws-text-muted)', textAlign: 'center' }}>…</p>
  if (error || !session) return <p style={{ padding: 60, color: 'var(--ws-danger)', textAlign: 'center' }}>{strings.wsNoSession}</p>

  // Keep the live copy of "me" in sync with realtime updates to my own row
  // (e.g. a second tab), while PreworkFlow still writes through immediately.
  const liveMe = participants.find((p) => p.id === participant.id) || participant
  const mergedParticipant = { ...participant, ...liveMe }

  const phaseLabel = { prework: strings.wsPhasePrework, opening: strings.wsPhaseOpening, calibration: strings.wsPhaseCalibration, deepdive: strings.wsPhaseDeepdive, prioritization: strings.wsPhasePrioritization, summary: strings.wsPhaseSummary }
  const calibIdx = Math.max(0, DIMENSIONS.findIndex((d) => d.id === session.active_dimension_id))
  const calibDim = DIMENSIONS[calibIdx] || DIMENSIONS[0]
  const solo = participants.length <= 1

  if (session.phase === 'prework') {
    return (
      <div className="ws-root">
        <PreworkFlow strings={strings} lang={lang} participant={mergedParticipant} onParticipantUpdate={setParticipant} />
      </div>
    )
  }

  if (session.mode === 'async') {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '26px 20px 80px' }}>
        <SummaryReport strings={strings} lang={lang} dims={DIMENSIONS} session={session} participants={participants} responses={[]} moves={[]} isFacilitator={false} mode="async" />
      </div>
    )
  }

  return (
    <div>
      <WorkshopProgress strings={strings} phase={session.phase} />
      <ParticipantStatus phaseLabel={phaseLabel[session.phase]} name={mergedParticipant.name} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '26px 20px 80px' }}>
        {session.phase === 'opening' && (
          <div className="ws-animate-in">
            <h2 style={h2Style}>{solo ? strings.wsOpeningTitleSolo : strings.wsOpeningTitle}</h2>
            <p style={bodyMuted}>{solo ? strings.wsOpeningIntroSolo : strings.wsOpeningIntro}</p>
            <div style={cardStyle}>
              <RadarPresentation strings={strings} lang={lang} dims={DIMENSIONS} participants={participants} emptyLabel={strings.wsNoPreworkYet} />
            </div>
          </div>
        )}

        {session.phase === 'calibration' && (
          <div className="ws-animate-in">
            <h2 style={h2Style}>{strings.wsCalibrationTitle}</h2>
            <p style={bodyMuted}>{solo ? strings.wsCalibrationIntroSolo : strings.wsCalibrationIntro}</p>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 20 }}>
                <span aria-hidden="true" style={{ width: 11, height: 11, borderRadius: 4, background: PALETTE[calibIdx] }} />
                {dimName(calibDim, lang)}
              </div>
              <SpreadChart strings={strings} dimension={calibDim} participants={participants} color={PALETTE[calibIdx]} />
            </div>
          </div>
        )}

        {session.phase === 'deepdive' && (
          <div className="ws-animate-in">
            <h2 style={h2Style}>{strings.wsDeepdiveTitle}</h2>
            <p style={bodyMuted}>{solo ? strings.wsDeepdiveIntroSolo : strings.wsDeepdiveIntro}</p>
            {!solo && <WorkshopInsight strings={strings} lang={lang} dims={DIMENSIONS} participants={participants} />}
            <DeepDiveView
              strings={strings} lang={lang} dims={DIMENSIONS} session={session} participants={participants} responses={responses}
              participant={mergedParticipant} sessionId={participant.sessionId} isFacilitator={false} reducedMotion={reducedMotion}
            />
          </div>
        )}

        {session.phase === 'prioritization' && (
          <div className="ws-animate-in">
            <h2 style={h2Style}>{strings.wsPrioritizationTitle}</h2>
            <p style={bodyMuted}>{strings.wsPrioritizationIntro}</p>
            <div style={cardStyle}>
              <MoveBoard strings={strings} sessionId={participant.sessionId} moves={moves} editable={false} />
            </div>
          </div>
        )}

        {session.phase === 'summary' && (
          <div className="ws-animate-in">
            <SummaryReport strings={strings} lang={lang} dims={DIMENSIONS} session={session} participants={participants} responses={responses} moves={moves} isFacilitator={false} />
          </div>
        )}
      </div>
    </div>
  )
}
