// AI-facilitated workshop mode (beta) — the same ANTHROPIC_API_KEY secret
// already configured for report-assess (see that function's header) drives
// two things here:
//
//   action "interview_turn": a short, targeted 1:1 conversation with one
//   participant about their weakest dimension(s), standing in for what a
//   live facilitator's deep-dive discussion would draw out. Ends with a
//   finish_interview tool call producing the exact same
//   blocker/owner/visible_change shape the human-facilitated CaptureWall
//   produces, so the rest of the app (SummaryReport, MoveBoard, the org
//   rollup) needs no separate rendering path for AI-sourced content.
//
//   action "session_synthesis": once an organizer generates the report, a
//   short narrative summarizing the whole session across all participants
//   -- this is what gets surfaced to a human moderator (in this session's
//   own summary, and in the org-wide rollup) without them having to read
//   every transcript themselves.
//
// Deploy: supabase functions deploy workshop-ai-facilitate
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-... (shared with
//          report-assess; set it once)

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const MODEL = 'claude-sonnet-5'
const MAX_TURNS = 6 // hard cap on facilitator questions per participant, regardless of model choice

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

async function callClaude(system: string, userContent: string, tools: any[], toolChoice: any) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system,
      tools,
      tool_choice: toolChoice,
      messages: [{ role: 'user', content: userContent }],
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Anthropic API error ${res.status}: ${errText.slice(0, 500)}`)
  }
  const data = await res.json()
  return data.content?.find((b: any) => b.type === 'tool_use')
}

const ASK_QUESTION_TOOL = {
  name: 'ask_question',
  description: 'Ask the participant one focused follow-up question.',
  input_schema: {
    type: 'object',
    properties: { question: { type: 'string' } },
    required: ['question'],
  },
}

const FINISH_INTERVIEW_TOOL = {
  name: 'finish_interview',
  description: 'End the interview and submit what you learned in the fixed schema the app expects.',
  input_schema: {
    type: 'object',
    properties: {
      responses: {
        type: 'array',
        description: 'One entry per capability actually discussed. Do not invent capabilities that were not part of the conversation.',
        items: {
          type: 'object',
          properties: {
            dimensionId: { type: 'string' },
            capabilityId: { type: 'string' },
            promptType: { type: 'string', enum: ['blocker', 'owner', 'visible_change'] },
            text: { type: 'string', description: "The participant's own words, summarized to one or two sentences -- not your own commentary." },
          },
          required: ['dimensionId', 'capabilityId', 'promptType', 'text'],
        },
      },
      move: {
        type: 'object',
        description: 'At most one concrete next action, only if the conversation actually surfaced one. Omit entirely if nothing concrete came up.',
        properties: {
          description: { type: 'string' },
          owner: { type: 'string', description: 'Leave empty if no owner was named.' },
          timeframe: { type: 'string', description: 'Leave empty if no timeframe was named.' },
        },
        required: ['description'],
      },
      narrative: { type: 'string', description: 'One or two sentences on what this participant told you, for a facilitator who was not in the conversation.' },
    },
    required: ['responses', 'narrative'],
  },
}

function buildInterviewSystemPrompt(lang: string, participantName: string, companyName: string, contextNote: string, targets: any[], forceFinish: boolean) {
  const targetLines = targets
    .map((t: any) => `- ${t.dimensionName} (id: ${t.dimensionId}): ${t.capabilities.map((c: any) => `[${c.id}] ${c.text}`).join(' | ')}`)
    .join('\n')
  return `You are facilitating a short, warm, specific discussion with ${participantName}${companyName ? ` at ${companyName}` : ''} as part of an organizational maturity workshop. You are standing in for a human facilitator's deep-dive discussion -- your job is to draw out real specifics, not to lecture.
${contextNote ? `\nContext the organizer gave about this session: ${contextNote}\n` : ''}
Reply in ${lang === 'de' ? 'German' : 'English'}.

The discussion should surface, for each capability below, whichever of these the participant actually has something to say about: what's blocking progress, who would own fixing it, or what visible change would show it's improving. You do not need to cover every capability or every angle -- depth on the ones that matter beats a checklist.

Capabilities in scope for this discussion:
${targetLines}

Ask ONE question at a time via ask_question. Keep questions short, concrete, and grounded in what the participant just said -- never ask about a capability they've already answered. When you've learned enough to write honest responses (usually 2-4 questions total), call finish_interview. Never fabricate a blocker, owner, or move the participant didn't actually say.${forceFinish ? '\n\nYou have reached the question limit for this interview. You MUST call finish_interview now, using your best judgment from the conversation so far. Do not call ask_question.' : ''}`
}

async function interviewTurn(body: any) {
  const { lang, participantName, companyName, contextNote, targets, transcript, forceFinish } = body
  if (!Array.isArray(targets) || targets.length === 0) throw new Error('No target dimensions provided.')

  const system = buildInterviewSystemPrompt(lang === 'de' ? 'de' : 'en', participantName || 'the participant', companyName || '', contextNote || '', targets, !!forceFinish)
  const historyText = (transcript || [])
    .map((t: any) => `${t.role === 'facilitator' ? 'Facilitator' : participantName || 'Participant'}: ${t.text}`)
    .join('\n')
  const userContent = historyText || '(The conversation has not started yet -- ask your first question.)'

  const tools = forceFinish ? [FINISH_INTERVIEW_TOOL] : [ASK_QUESTION_TOOL, FINISH_INTERVIEW_TOOL]
  const toolChoice = forceFinish ? { type: 'tool', name: 'finish_interview' } : { type: 'auto' }
  const toolUse = await callClaude(system, userContent, tools, toolChoice)
  if (!toolUse) throw new Error('Model did not call a tool.')

  if (toolUse.name === 'ask_question') {
    return { done: false, question: toolUse.input.question }
  }
  const input = toolUse.input
  return {
    done: true,
    responses: Array.isArray(input.responses) ? input.responses : [],
    move: input.move && input.move.description ? input.move : null,
    narrative: input.narrative || '',
  }
}

const SYNTHESIS_TOOL = {
  name: 'submit_synthesis',
  description: 'Submit the session-level synthesis for the human moderator.',
  input_schema: {
    type: 'object',
    properties: {
      headline: { type: 'string', description: 'One short sentence, the single most important takeaway (e.g. a specific bottleneck).' },
      narrative: { type: 'string', description: '2-4 sentences a moderator overseeing many teams can read in a few seconds -- what stands out, and what to do next.' },
    },
    required: ['headline', 'narrative'],
  },
}

async function sessionSynthesis(body: any) {
  const { lang, companyName, contextNote, dims, participants, responses, moves } = body

  const dimNameById: Record<string, string> = {}
  ;(dims || []).forEach((d: any) => { dimNameById[d.id] = d.name })

  const answersText = (participants || [])
    .map((p: any) => `${p.name}: ${Object.entries(p.answers || {}).map(([id, v]) => `${dimNameById[id] || id}=${v}`).join(', ') || '(no self-assessment)'}`)
    .join('\n')
  const responsesText = (responses || [])
    .map((r: any) => `[${dimNameById[r.dimensionId] || r.dimensionId}/${r.promptType}] ${r.participantName || '?'}: ${r.text}`)
    .join('\n') || '(none captured)'
  const movesText = (moves || []).map((m: any) => `- ${m.description}${m.owner ? ` (owner: ${m.owner})` : ''}${m.timeframe ? ` (${m.timeframe})` : ''}`).join('\n') || '(none)'

  const system = `You are writing a short synthesis of an organizational maturity workshop session for a human moderator who oversees many such sessions across an organization and has not read the raw transcripts.${companyName ? ` The unit is: ${companyName}.` : ''}${contextNote ? ` Context: ${contextNote}` : ''}
Reply in ${lang === 'de' ? 'German' : 'English'}. Be concrete and specific -- name the actual dimension or blocker, never a generic platitude. If the data is too thin to say anything specific, say that plainly instead of padding.`

  const userContent = `Self-assessment scores per participant:\n${answersText}\n\nCaptured discussion:\n${responsesText}\n\nProposed moves:\n${movesText}`

  const toolUse = await callClaude(system, userContent, [SYNTHESIS_TOOL], { type: 'tool', name: 'submit_synthesis' })
  if (!toolUse) throw new Error('Model did not return a submit_synthesis tool call.')
  return { headline: toolUse.input.headline, narrative: toolUse.input.narrative }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  if (!ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY is not configured on this function.' }, 500)

  try {
    const body = await req.json()
    if (body.action === 'interview_turn') {
      const turnCount = (body.transcript || []).filter((t: any) => t.role === 'facilitator').length
      const result = await interviewTurn({ ...body, forceFinish: body.forceFinish || turnCount >= MAX_TURNS })
      return json({ ...result, model: MODEL })
    }
    if (body.action === 'session_synthesis') {
      const result = await sessionSynthesis(body)
      return json({ ...result, model: MODEL })
    }
    return json({ error: `Unknown action: ${body.action}` }, 400)
  } catch (err) {
    return json({ error: String((err as Error)?.message ?? err) }, 500)
  }
})
