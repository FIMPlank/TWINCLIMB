import { supabase } from '../workshop/supabaseClient'
import { generateCode } from '../workshop/codeGen'

// AI Report Check data layer. Same code-boundary access model as the
// workshop tables — see supabase/migrations/20260721_report_check.sql.

export async function assessReport(text, lang, docType) {
  const { data, error } = await supabase.functions.invoke('report-assess', { body: { text, lang, docType } })
  if (error) throw new Error(error.message || 'The assessment function failed.')
  if (data?.error) throw new Error(data.error)
  return data // { caps, evidence, model, truncated }
}

export async function saveReportCheck({ lang, companyName, sourceFilename, docType, caps, evidence, aiModel }) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const row = {
      code, lang, caps, evidence, ai_model: aiModel, doc_type: docType || 'general',
      company_name: companyName || null, source_filename: sourceFilename || null,
    }
    const { data, error } = await supabase.from('report_checks').insert(row).select().single()
    if (!error) return data
    if (error.code !== '23505') throw error
  }
  throw new Error('Could not allocate a unique link code — please retry.')
}

export async function fetchReportCheck(code) {
  const { data, error } = await supabase.from('report_checks').select().eq('code', code.toUpperCase().trim()).maybeSingle()
  if (error) throw error
  return data
}

export async function updateReportCheck(id, patch) {
  const { error } = await supabase.from('report_checks').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}
