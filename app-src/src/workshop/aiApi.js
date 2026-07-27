import { supabase } from './supabaseClient'

// Client for the workshop-ai-facilitate edge function -- see that
// function's header for the two actions. Same invoke pattern as
// reportcheck/api.js's assessReport(), same shared ANTHROPIC_API_KEY secret.

export async function runInterviewTurn(payload) {
  const { data, error } = await supabase.functions.invoke('workshop-ai-facilitate', { body: { action: 'interview_turn', ...payload } })
  if (error) throw new Error(error.message || 'The AI facilitator is unavailable right now.')
  if (data?.error) throw new Error(data.error)
  return data // { done, question } | { done: true, responses, move, narrative, model }
}

export async function runSessionSynthesis(payload) {
  const { data, error } = await supabase.functions.invoke('workshop-ai-facilitate', { body: { action: 'session_synthesis', ...payload } })
  if (error) throw new Error(error.message || 'The AI facilitator is unavailable right now.')
  if (data?.error) throw new Error(data.error)
  return data // { headline, narrative, model }
}

// Picks the n dimensions where the group's self-assessment is weakest, the
// same reference-stage logic SummaryReport/DeepDiveView already use (lowest
// score across participants) -- so the AI interview targets exactly what a
// live facilitator would have picked for the group to dig into together.
export function pickWeakestDimensions(dims, participants, n = 2) {
  const withAnswers = participants.filter((p) => p.answers && Object.keys(p.answers).length > 0)
  if (withAnswers.length === 0) return [dims[0].id]
  const scored = dims.map((d) => {
    const vals = withAnswers.map((p) => p.answers[d.id]).filter((v) => v !== undefined && v !== null)
    const ref = vals.length ? Math.min(...vals) : 0
    return { id: d.id, ref }
  })
  return scored.sort((a, b) => a.ref - b.ref).slice(0, n).map((s) => s.id)
}
