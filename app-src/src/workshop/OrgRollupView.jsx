import { useEffect, useState } from 'react'
import { DIMENSIONS, dimName } from '../ttcmm'
import { SHORT_LABEL } from '../i18n'
import { fetchOrgChart, fetchOrgRollupData } from './orgApi'
import { rollupOrg, integratedStage, weakestDimension, totalDistinctParticipants } from './orgRollup'
import UnitRadar from './components/UnitRadar'
import OrgCanvas from './components/OrgCanvas'

const cardStyle = { background: 'var(--ws-surface)', border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-lg)', boxShadow: 'var(--ws-shadow-soft)', padding: 24 }

function flattenRollup(nodes, map = {}) {
  nodes.forEach((n) => {
    map[n.unit.id] = n
    flattenRollup(n.children, map)
  })
  return map
}

function ManagementSummary({ strings, lang, node, unit, links, nameById }) {
  const stage = integratedStage(node.stages, DIMENSIONS)
  const extraChildren = links.filter((l) => l.parent_unit_id === unit.id).map((l) => nameById[l.unit_id]).filter(Boolean)
  const extraParents = links.filter((l) => l.unit_id === unit.id).map((l) => nameById[l.parent_unit_id]).filter(Boolean)
  if (stage === null) {
    return <p style={{ fontSize: 14, color: 'var(--ws-text-muted)', fontStyle: 'italic', margin: 0 }}>{strings.wsOrgNoDataYet}</p>
  }
  const SHORT = SHORT_LABEL[lang]
  const weakId = weakestDimension(node.stages, DIMENSIONS)
  const weakDim = DIMENSIONS.find((d) => d.id === weakId)
  const bottleneckName = weakDim ? dimName(weakDim, lang) : ''
  return (
    <div>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ws-text-primary)', margin: 0 }}>
        {strings.wsOrgSummaryText(strings.wsOrgParticipants(node.participantCount), SHORT[stage], bottleneckName)}
      </p>
      {extraChildren.length > 0 && (
        <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ws-text-muted)', margin: '8px 0 0' }}>{strings.wsOrgAlsoIncludes(extraChildren.join(', '))}</p>
      )}
      {extraParents.length > 0 && (
        <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ws-text-muted)', margin: '8px 0 0' }}>{strings.wsOrgAlsoFeedsInto(extraParents.join(', '))}</p>
      )}
    </div>
  )
}

export default function OrgRollupView({ strings, lang, orgId }) {
  const [org, setOrg] = useState(null)
  const [units, setUnits] = useState([])
  const [sessionsById, setSessionsById] = useState({})
  const [participantsBySession, setParticipantsBySession] = useState({})
  const [links, setLinks] = useState([])
  const [rollup, setRollup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const verifiedKey = `twinclimb_org_verified_${orgId}`
  const [verified, setVerified] = useState(() => { try { return localStorage.getItem(verifiedKey) === '1' } catch (e) { return false } })
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchOrgChart(orgId), fetchOrgRollupData(orgId)])
      .then(([o, data]) => {
        if (cancelled) return
        setOrg(o)
        setUnits(data.units)
        setSessionsById(data.sessionsById)
        setParticipantsBySession(data.participantsBySession)
        setLinks(data.links)
        setRollup(rollupOrg(data.units, data.participantsBySession, DIMENSIONS, data.links))
      })
      .catch((e) => { if (!cancelled) setError(e) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [orgId])

  if (loading) return <p style={{ padding: 60, color: 'var(--ws-text-muted)', textAlign: 'center' }}>…</p>
  if (error || !org) return <p style={{ padding: 60, color: 'var(--ws-danger)', textAlign: 'center' }}>{strings.wsNoSession}</p>

  if (!verified) {
    const submitPin = (e) => {
      e.preventDefault()
      if (pin === org.facilitator_pin) {
        try { localStorage.setItem(verifiedKey, '1') } catch (err) {}
        setVerified(true)
      } else {
        setPinError(true)
      }
    }
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <form onSubmit={submitPin} style={{ ...cardStyle, maxWidth: 360, width: '100%', textAlign: 'center' }}>
          <p style={{ fontSize: 14.5, color: 'var(--ws-text-muted)', marginBottom: 14 }}>{strings.wsPinPrompt}</p>
          <input
            value={pin} onChange={(e) => { setPin(e.target.value); setPinError(false) }} placeholder={strings.wsPinPlaceholder} autoFocus
            style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 'var(--ws-radius-sm)', border: '1.5px solid var(--ws-border-soft)', background: 'var(--ws-surface)', color: 'var(--ws-text-primary)', fontSize: 20, textAlign: 'center', letterSpacing: '0.3em', fontFamily: 'var(--ws-font-mono)' }}
          />
          {pinError && <p style={{ color: 'var(--ws-danger)', fontSize: 13, marginTop: 10 }}>{strings.wsPinWrong}</p>}
          <button type="submit" style={{ marginTop: 16, width: '100%', padding: '13px 22px', border: 'none', borderRadius: 'var(--ws-radius-sm)', background: 'var(--ws-brand)', color: 'var(--ws-ink-on-brand)', fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 14 }}>
            {strings.wsPinSubmit}
          </button>
        </form>
      </div>
    )
  }

  const SHORT = SHORT_LABEL[lang]
  const root = rollup[0]
  const rootStage = root ? integratedStage(root.stages, DIMENSIONS) : null
  const rollupById = flattenRollup(rollup)
  const selectedUnit = selectedId ? units.find((u) => u.id === selectedId) : null
  const selectedNode = selectedId ? rollupById[selectedId] : null
  const nameById = {}
  units.forEach((u) => { nameById[u.id] = u.name })
  const orgParticipantTotal = totalDistinctParticipants(units, participantsBySession)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 28px 100px' }}>
      <div style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ws-text-muted)' }}>{strings.wsOrgRollupKicker}</div>
      <h2 style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 'clamp(26px,3.4vw,36px)', margin: '8px 0 6px', letterSpacing: '-0.01em' }}>{org.name}</h2>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ws-text-muted)', maxWidth: '68ch' }}>{strings.wsOrgRollupIntro}</p>

      {root && (
        <div style={{ ...cardStyle, marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ws-text-muted)' }}>{strings.wsOrgWholeOrgTag}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8 }}>
              <span style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 48, lineHeight: 1, color: rootStage === null ? 'var(--ws-text-muted)' : 'var(--ws-brand-deep)' }}>
                {rootStage === null ? '–' : rootStage}
              </span>
              <span style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 17 }}>{rootStage === null ? strings.wsOrgNoDataYet : SHORT[rootStage]}</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ws-text-muted)', marginTop: 10 }}>{strings.wsOrgParticipants(orgParticipantTotal)}</p>
          </div>
          <UnitRadar lang={lang} dims={DIMENSIONS} stages={root.stages} size={220} emptyLabel={strings.wsNoPreworkYet} />
        </div>
      )}

      {units.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3 style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 18, margin: '0 0 4px' }}>{strings.wsOrgByDepartment}</h3>
          <OrgCanvas
            units={units}
            boxWidth={168}
            boxHeight={188}
            extraConnectors={links.map((l) => ({ parentId: l.parent_unit_id, childId: l.unit_id }))}
            renderNode={(unit) => {
              const node = rollupById[unit.id]
              const isRoot = unit.id === root?.unit.id
              const isSelected = unit.id === selectedId
              const stage = node ? integratedStage(node.stages, DIMENSIONS) : null
              const linkCount = links.filter((l) => l.unit_id === unit.id || l.parent_unit_id === unit.id).length
              return (
                <button
                  type="button"
                  onClick={() => setSelectedId((cur) => (cur === unit.id ? null : unit.id))}
                  style={{
                    border: `1.5px solid ${isSelected ? 'var(--ws-brand)' : (isRoot ? 'var(--ws-brand)' : 'var(--ws-border-soft)')}`,
                    borderRadius: 'var(--ws-radius-md)', padding: '10px 10px 8px', background: isSelected ? 'var(--ws-bg-soft)' : 'var(--ws-surface)',
                    height: '100%', width: '100%', boxSizing: 'border-box', boxShadow: isSelected ? 'var(--ws-shadow-deep)' : 'var(--ws-shadow-soft)',
                    textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <div style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 12.5, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {unit.name}
                  </div>
                  <UnitRadar lang={lang} dims={DIMENSIONS} stages={node ? node.stages : {}} size={92} showLabels={false} emptyLabel="" />
                  <div style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 10.5, marginTop: 2, color: stage === null ? 'var(--ws-text-muted)' : 'var(--ws-brand-deep)', fontWeight: stage === null ? 400 : 600 }}>
                    {stage === null ? strings.wsOrgNoDataYet : `${strings.wsOrgStageLabel} ${stage}`}
                  </div>
                  {linkCount > 0 && (
                    <div title={strings.wsOrgLinkBadge(linkCount)} style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 9, color: 'var(--ws-brand)', marginTop: 1 }}>
                      🔗{linkCount}
                    </div>
                  )}
                </button>
              )
            }}
          />

          {selectedUnit && selectedNode && (
            <div className="ws-animate-in" style={{ ...cardStyle, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ws-brand-deep)' }}>{strings.wsOrgSummaryHeading}</div>
                  <h4 style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 17, margin: '4px 0 0' }}>{selectedUnit.name}</h4>
                </div>
                <button type="button" onClick={() => setSelectedId(null)} aria-label={strings.wsOrgCollapse} title={strings.wsOrgCollapse} style={{ width: 28, height: 28, border: 'none', background: 'transparent', fontSize: 16, cursor: 'pointer', color: 'var(--ws-text-muted)' }}>×</button>
              </div>
              <div style={{ marginTop: 12 }}>
                <ManagementSummary strings={strings} lang={lang} node={selectedNode} unit={selectedUnit} links={links} nameById={nameById} />
              </div>
              <a
                href={`?facilitate=${selectedUnit.session_id}&pin=${sessionsById[selectedUnit.session_id]?.facilitator_pin || ''}`}
                style={{ display: 'inline-block', marginTop: 16, fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 14, color: 'var(--ws-brand-deep)', textDecoration: 'none' }}
              >
                {strings.wsOrgViewDetailed}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
