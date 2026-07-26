import { useEffect, useState } from 'react'
import { fetchOrgChart, fetchOrgRollupData, createOrgUnit, renameOrgUnit, deleteOrgUnit, addOrgUnitLink, removeOrgUnitLink } from './orgApi'
import { canLinkAsExtraParent } from './orgRollup'
import OrgCanvas from './components/OrgCanvas'

const cardStyle = { background: 'var(--ws-surface)', border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-lg)', boxShadow: 'var(--ws-shadow-soft)', padding: 24 }
const h2Style = { fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 'clamp(22px,2.8vw,28px)', margin: '8px 0 6px', letterSpacing: '-0.01em' }
const bodyMuted = { fontSize: 14.5, lineHeight: 1.6, color: 'var(--ws-text-muted)', maxWidth: '68ch' }
const iconBtn = { width: 30, height: 30, border: '1px solid var(--ws-border-soft)', borderRadius: 7, background: 'var(--ws-surface)', fontSize: 13.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, textDecoration: 'none', color: 'inherit' }
const labelStyle = {
  display: 'block', fontFamily: 'var(--ws-font-mono)', fontSize: 10.5, letterSpacing: '0.1em', color: 'var(--ws-text-muted)',
  textTransform: 'uppercase', marginBottom: 6, marginTop: 16,
}
const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 'var(--ws-radius-sm)',
  border: '1.5px solid var(--ws-border-soft)', fontSize: 14, fontFamily: 'inherit', background: 'var(--ws-surface)', color: 'var(--ws-text-primary)',
}
const DEFAULT_MINUTES = { opening: 10, calibration: 15, deepdive: 40, prioritization: 25 }

function statusPill(strings, unit, participantsBySession) {
  const list = participantsBySession[unit.session_id] || []
  const answered = list.filter((p) => Object.keys(p.answers || {}).length > 0).length
  if (list.length === 0) return { text: strings.wsOrgStatusEmpty, tone: 'muted' }
  if (answered === 0) return { text: strings.wsOrgStatusJoined(list.length), tone: 'muted' }
  return { text: strings.wsOrgStatusAnswering(answered, list.length), tone: 'active' }
}

function joinUrlFor(lang, session) {
  if (!session) return ''
  return `${window.location.origin}${window.location.pathname.replace(/workshop(\.de)?\.html$/, `workshop${lang === 'de' ? '.de' : ''}.html`)}?code=${session.code}`
}

// Same fields FacilitatorHome offers a standalone session -- a unit's
// session is never a cut-down version of "real" workshop mode.
function NewUnitModal({ strings, onSubmit, onClose }) {
  const [name, setName] = useState('')
  const [mode, setMode] = useState('async')
  const [contextNote, setContextNote] = useState('')
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      await onSubmit({ name: name.trim(), mode, contextNote: contextNote.trim(), phaseMinutes: minutes })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(13,23,20,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
      onClick={onClose}
    >
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} style={{ background: 'var(--ws-surface)', borderRadius: 'var(--ws-radius-lg)', padding: 26, maxWidth: 440, width: '100%', boxShadow: 'var(--ws-shadow-deep)', maxHeight: '85vh', overflowY: 'auto' }}>
        <h3 style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 19, margin: 0 }}>{strings.wsOrgUnitFormTitle}</h3>

        <label style={{ ...labelStyle, marginTop: 18 }}>{strings.wsOrgUnitNameLabel}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={strings.wsOrgUnitNamePlaceholder} autoFocus style={inputStyle} />

        <label style={labelStyle}>{strings.wsModeGroupLabel}</label>
        <div role="group" aria-label={strings.wsModeGroupLabel} style={{ display: 'flex', gap: 8 }}>
          {['live', 'async'].map((m) => (
            <button
              key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m}
              style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 13, fontFamily: 'var(--ws-font-head)', fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${mode === m ? 'var(--ws-brand)' : 'var(--ws-border-soft)'}`,
                background: mode === m ? 'var(--ws-brand)' : 'var(--ws-surface)', color: mode === m ? 'var(--ws-ink-on-brand)' : 'var(--ws-text-muted)',
              }}
            >
              {m === 'live' ? strings.wsModeLive : strings.wsModeAsync}
            </button>
          ))}
        </div>

        <label style={labelStyle}>{strings.wsContextNoteLabel}</label>
        <textarea value={contextNote} onChange={(e) => setContextNote(e.target.value)} placeholder={strings.wsContextNotePlaceholder} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />

        {mode === 'live' && (
          <>
            <label style={labelStyle}>{strings.wsPhaseMinutesLabel}</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['opening', 'calibration', 'deepdive', 'prioritization'].map((phase) => (
                <div key={phase} style={{ flex: '1 1 90px' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--ws-text-muted)', marginBottom: 3 }}>{strings[`wsPhase${phase[0].toUpperCase()}${phase.slice(1)}`]}</div>
                  <input
                    type="number" min={1} max={180} value={minutes[phase]}
                    onChange={(e) => setMinutes((m) => ({ ...m, [phase]: Math.max(1, Number(e.target.value) || 1) }))}
                    style={{ ...inputStyle, padding: '8px 9px' }}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button type="submit" disabled={busy || !name.trim()} style={{ flex: 1, padding: '12px 18px', border: 'none', borderRadius: 'var(--ws-radius-sm)', background: 'var(--ws-brand)', color: 'var(--ws-ink-on-brand)', fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
            {busy ? strings.wsCreating : strings.wsOrgUnitFormCreate}
          </button>
          <button type="button" onClick={onClose} style={{ padding: '12px 18px', border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-sm)', background: 'var(--ws-surface)', color: 'var(--ws-text-primary)', fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            {strings.wsOrgCancel}
          </button>
        </div>
      </form>
    </div>
  )
}

// Lets a unit's rolled-up stage also count toward a parent OTHER than its
// one primary slot in the tree -- e.g. a shared "IT" unit that should feed
// both Operations and Finance. canLinkAsExtraParent already filters out
// anything that would be redundant (the current primary parent) or would
// close a loop, so every option offered here is always safe to add.
function LinkUnitModal({ strings, unit, units, links, onAdd, onRemove, onClose }) {
  const [selected, setSelected] = useState('')
  const [busy, setBusy] = useState(false)
  const nameById = {}
  units.forEach((u) => { nameById[u.id] = u.name })
  const existingParentIds = links.filter((l) => l.unit_id === unit.id).map((l) => l.parent_unit_id)
  const candidates = units.filter((u) => !existingParentIds.includes(u.id) && canLinkAsExtraParent(unit.id, u.id, units, links))

  async function add() {
    if (!selected || busy) return
    setBusy(true)
    try {
      await onAdd(selected)
      setSelected('')
    } finally {
      setBusy(false)
    }
  }

  async function remove(parentUnitId) {
    setBusy(true)
    try {
      await onRemove(parentUnitId)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(13,23,20,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--ws-surface)', borderRadius: 'var(--ws-radius-lg)', padding: 26, maxWidth: 420, width: '100%', boxShadow: 'var(--ws-shadow-deep)', maxHeight: '85vh', overflowY: 'auto' }}>
        <h3 style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 19, margin: 0 }}>{strings.wsOrgLinkModalTitle(unit.name)}</h3>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ws-text-muted)', marginTop: 10 }}>{strings.wsOrgLinkIntro}</p>

        <label style={labelStyle}>{strings.wsOrgLinkExistingHeading}</label>
        {existingParentIds.length === 0 ? (
          <p style={{ fontSize: 13.5, color: 'var(--ws-text-muted)', margin: 0 }}>{strings.wsOrgLinkNone}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {existingParentIds.map((id) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-sm)', fontSize: 13.5 }}>
                <span>{nameById[id] || '—'}</span>
                <button type="button" onClick={() => remove(id)} disabled={busy} style={{ border: 'none', background: 'transparent', color: 'var(--ws-danger)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--ws-font-head)', fontWeight: 600 }}>
                  {strings.wsOrgLinkRemove}
                </button>
              </div>
            ))}
          </div>
        )}

        <label style={labelStyle}>{strings.wsOrgLinkUnit}</label>
        {candidates.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--ws-text-muted)', margin: 0 }}>{strings.wsOrgLinkNoCandidates}</p>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={selected} onChange={(e) => setSelected(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              <option value="">{strings.wsOrgLinkPickPlaceholder}</option>
              {candidates.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <button
              type="button" onClick={add} disabled={!selected || busy}
              style={{ padding: '10px 16px', border: 'none', borderRadius: 'var(--ws-radius-sm)', background: 'var(--ws-brand)', color: 'var(--ws-ink-on-brand)', fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', opacity: (!selected || busy) ? 0.5 : 1 }}
            >
              {strings.wsOrgLinkAdd}
            </button>
          </div>
        )}

        <div style={{ marginTop: 22 }}>
          <button type="button" onClick={onClose} style={{ padding: '11px 18px', border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-sm)', background: 'var(--ws-surface)', color: 'var(--ws-text-primary)', fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            {strings.wsOrgLinkDone}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrgChartBuilder({ strings, lang, orgId }) {
  const [org, setOrg] = useState(null)
  const [units, setUnits] = useState([])
  const [sessionsById, setSessionsById] = useState({})
  const [participantsBySession, setParticipantsBySession] = useState({})
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [addingUnder, setAddingUnder] = useState(null) // unit or null
  const [linkingUnit, setLinkingUnit] = useState(null) // unit or null
  const verifiedKey = `twinclimb_org_verified_${orgId}`
  const [verified, setVerified] = useState(() => { try { return localStorage.getItem(verifiedKey) === '1' } catch (e) { return false } })
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)

  async function load() {
    try {
      const [o, rollup] = await Promise.all([fetchOrgChart(orgId), fetchOrgRollupData(orgId)])
      setOrg(o)
      setUnits(rollup.units)
      setSessionsById(rollup.sessionsById)
      setParticipantsBySession(rollup.participantsBySession)
      setLinks(rollup.links)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Departments join and answer at their own pace over hours/days, not in
    // one live room -- a light periodic refetch keeps status pills current
    // without the complexity of subscribing to a realtime channel per unit.
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [orgId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddUnit({ name, mode, contextNote, phaseMinutes }) {
    await createOrgUnit(org, addingUnder ? addingUnder.id : null, name, { mode, contextNote, phaseMinutes })
    setAddingUnder(null)
    await load()
  }

  async function handleRename(unit) {
    const name = window.prompt(strings.wsOrgRename, unit.name)
    if (!name || !name.trim() || name.trim() === unit.name) return
    setBusyId(unit.id)
    try {
      await renameOrgUnit(unit.id, name.trim())
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(unit) {
    if (!window.confirm(strings.wsOrgConfirmDelete(unit.name))) return
    setBusyId(unit.id)
    try {
      await deleteOrgUnit(unit.id)
      await load()
    } finally {
      setBusyId(null)
    }
  }

  function handleCopy(unit, session) {
    const url = joinUrlFor(lang, session)
    if (!url) return
    navigator.clipboard?.writeText(url).then(() => { setCopiedId(unit.id); setTimeout(() => setCopiedId(null), 1800) })
  }

  async function handleAddLink(parentUnitId) {
    await addOrgUnitLink(linkingUnit.id, parentUnitId)
    await load()
  }

  async function handleRemoveLink(parentUnitId) {
    await removeOrgUnitLink(linkingUnit.id, parentUnitId)
    await load()
  }

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

  const root = units.find((u) => !u.parent_unit_id)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 28px 100px' }}>
      <div style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ws-text-muted)' }}>{strings.wsOrgKicker}</div>
      <h2 style={h2Style}>{org.name}</h2>
      <p style={bodyMuted}>{strings.wsOrgBuilderIntro}</p>

      <div style={{ marginTop: 24 }}>
        <OrgCanvas
          units={units}
          boxWidth={220}
          boxHeight={152}
          extraConnectors={links.map((l) => ({ parentId: l.parent_unit_id, childId: l.unit_id }))}
          renderNode={(unit) => {
            const session = sessionsById[unit.session_id]
            const pill = statusPill(strings, unit, participantsBySession)
            const isRoot = unit.id === root?.id
            const busy = busyId === unit.id
            const linkCount = links.filter((l) => l.unit_id === unit.id || l.parent_unit_id === unit.id).length
            return (
              <div style={{ border: `1px solid ${isRoot ? 'var(--ws-brand)' : 'var(--ws-border-soft)'}`, borderRadius: 'var(--ws-radius-md)', padding: '12px 13px', background: isRoot ? 'var(--ws-brand-tint)' : 'var(--ws-surface)', height: '100%', boxSizing: 'border-box', boxShadow: 'var(--ws-shadow-soft)' }}>
                <div style={{ fontFamily: 'var(--ws-font-head)', fontWeight: 700, fontSize: 14, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {unit.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                  {isRoot && <span style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--ws-brand-deep)', textTransform: 'uppercase' }}>{strings.wsOrgWholeOrgTag}</span>}
                  {session && (
                    <span style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 9, letterSpacing: '0.08em', color: 'var(--ws-text-muted)', textTransform: 'uppercase' }}>
                      {session.mode === 'live' ? strings.wsModeLive : strings.wsModeAsync}
                    </span>
                  )}
                  {linkCount > 0 && (
                    <span title={strings.wsOrgLinkBadge(linkCount)} style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 9, letterSpacing: '0.04em', color: 'var(--ws-brand)', border: '1px solid var(--ws-brand)', borderRadius: 8, padding: '0 5px' }}>
                      🔗{linkCount}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, marginTop: 5, color: pill.tone === 'active' ? 'var(--ws-brand-deep)' : 'var(--ws-text-muted)', fontWeight: pill.tone === 'active' ? 600 : 400 }}>
                  {pill.text}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => handleCopy(unit, session)} disabled={!session} title={strings.wsOrgCopyLink} aria-label={strings.wsOrgCopyLink} style={iconBtn}>
                    {copiedId === unit.id ? '✓' : '⧉'}
                  </button>
                  {session && (
                    <a href={`?facilitate=${session.id}&pin=${session.facilitator_pin}`} title={strings.wsOrgFacilitate} aria-label={strings.wsOrgFacilitate} style={iconBtn}>▶</a>
                  )}
                  <button type="button" onClick={() => setAddingUnder(unit)} disabled={busy} title={strings.wsOrgAddUnit} aria-label={strings.wsOrgAddUnit} style={iconBtn}>+</button>
                  <button type="button" onClick={() => setLinkingUnit(unit)} disabled={busy} title={strings.wsOrgLinkUnit} aria-label={strings.wsOrgLinkUnit} style={iconBtn}>🔗</button>
                  <button type="button" onClick={() => handleRename(unit)} disabled={busy} title={strings.wsOrgRename} aria-label={strings.wsOrgRename} style={iconBtn}>✎</button>
                  {!isRoot && (
                    <button type="button" onClick={() => handleDelete(unit)} disabled={busy} title={strings.wsOrgDelete} aria-label={strings.wsOrgDelete} style={{ ...iconBtn, color: 'var(--ws-danger)' }}>×</button>
                  )}
                </div>
              </div>
            )
          }}
        />
      </div>

      <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <a
          href={`?orgview=${orgId}`}
          style={{ padding: '13px 24px', borderRadius: 'var(--ws-radius-sm)', background: 'var(--ws-brand)', color: 'var(--ws-ink-on-brand)', fontFamily: 'var(--ws-font-head)', fontWeight: 600, fontSize: 14.5, textDecoration: 'none' }}
        >
          {strings.wsOrgViewResults}
        </a>
        <span style={{ fontFamily: 'var(--ws-font-mono)', fontSize: 11.5, color: 'var(--ws-text-muted)' }}>{strings.wsPinDisplay(org.facilitator_pin)}</span>
      </div>

      {addingUnder !== null && (
        <NewUnitModal strings={strings} onSubmit={handleAddUnit} onClose={() => setAddingUnder(null)} />
      )}

      {linkingUnit !== null && (
        <LinkUnitModal
          strings={strings} unit={linkingUnit} units={units} links={links}
          onAdd={handleAddLink} onRemove={handleRemoveLink} onClose={() => setLinkingUnit(null)}
        />
      )}
    </div>
  )
}
