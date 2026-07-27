import { supabase } from './supabaseClient'
import { generatePin } from './codeGen'
import { createSession } from './api'

// Thin data layer over org_charts/org_units, mirroring api.js. Each unit's
// own assessment is a completely ordinary workshop_sessions row (async
// mode) created through the exact same createSession() the standalone
// "Async team check" flow uses -- a unit IS a session, just one that's
// attached to a place in an org tree instead of standing alone.

export async function createOrgChart(facilitatorName, lang, orgName) {
  const { data, error } = await supabase
    .from('org_charts')
    .insert({ name: orgName, facilitator_name: facilitatorName, lang, facilitator_pin: generatePin() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchOrgChart(orgId) {
  const { data, error } = await supabase.from('org_charts').select().eq('id', orgId).maybeSingle()
  if (error) throw error
  return data
}

// opts carries the exact same session-customization fields the standalone
// FacilitatorHome form offers (mode, contextNote, phaseMinutes) -- a unit's
// session is created through the very same createSession() that flow uses,
// so nothing about it is a cut-down version of a "real" workshop session.
export async function createOrgUnit(org, parentUnitId, name, opts = {}) {
  const mode = opts.mode === 'live' || opts.mode === 'ai' ? opts.mode : 'async'
  const sessionOpts = { mode, companyName: name }
  if (opts.contextNote) sessionOpts.contextNote = opts.contextNote
  if (mode === 'live' && opts.phaseMinutes) sessionOpts.phaseMinutes = opts.phaseMinutes
  const session = await createSession(org.facilitator_name, org.lang, sessionOpts)
  const { data, error } = await supabase
    .from('org_units')
    .insert({ org_id: org.id, parent_unit_id: parentUnitId ?? null, session_id: session.id, name })
    .select()
    .single()
  if (error) throw error
  return { ...data, session }
}

export async function renameOrgUnit(unitId, name) {
  const { error } = await supabase.from('org_units').update({ name }).eq('id', unitId)
  if (error) throw error
}

export async function deleteOrgUnit(unitId) {
  const { error } = await supabase.from('org_units').delete().eq('id', unitId)
  if (error) throw error
}

export async function fetchOrgUnits(orgId) {
  const { data, error } = await supabase.from('org_units').select().eq('org_id', orgId).order('sort_order').order('created_at')
  if (error) throw error
  return data
}

// Extra parent_unit_id edges on top of a unit's one primary parent slot --
// see supabase/migrations/20260724_org_chart_v2.sql. A unit keeps exactly
// one visual position in the tree/canvas (its primary parent); a link here
// only makes its rolled-up stage also count toward another unit, for cases
// like a shared "IT" team serving more than one department.
export async function addOrgUnitLink(unitId, parentUnitId) {
  const { error } = await supabase.from('org_unit_links').insert({ unit_id: unitId, parent_unit_id: parentUnitId })
  if (error) throw error
}

export async function removeOrgUnitLink(unitId, parentUnitId) {
  const { error } = await supabase.from('org_unit_links').delete().eq('unit_id', unitId).eq('parent_unit_id', parentUnitId)
  if (error) throw error
}

// Bulk-load every unit's session + participants + extra-parent links in one
// pass -- used by both the builder (per-unit status pills) and the rollup
// view (aggregation).
export async function fetchOrgRollupData(orgId) {
  const units = await fetchOrgUnits(orgId)
  const sessionIds = units.map((u) => u.session_id)
  const unitIds = units.map((u) => u.id)
  if (sessionIds.length === 0) return { units, sessionsById: {}, participantsBySession: {}, links: [] }

  const [{ data: sessions, error: sErr }, { data: participants, error: pErr }, { data: links, error: lErr }] = await Promise.all([
    supabase.from('workshop_sessions').select().in('id', sessionIds),
    supabase.from('workshop_participants').select().in('session_id', sessionIds),
    supabase.from('org_unit_links').select().in('unit_id', unitIds),
  ])
  if (sErr) throw sErr
  if (pErr) throw pErr
  if (lErr) throw lErr

  const sessionsById = {}
  sessions.forEach((s) => { sessionsById[s.id] = s })
  const participantsBySession = {}
  participants.forEach((p) => { (participantsBySession[p.session_id] ||= []).push(p) })
  return { units, sessionsById, participantsBySession, links }
}
