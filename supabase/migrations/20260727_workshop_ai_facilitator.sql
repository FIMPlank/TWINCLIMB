-- AI-facilitated workshop mode: a third parallel path alongside 'live'
-- (human facilitator in the room) and 'async' (bare self-report, no
-- facilitation at all). 'ai' keeps the self-paced, no-scheduling shape of
-- async but adds an actual facilitated discussion -- an LLM interviews each
-- participant 1:1 about their weakest dimension(s) and writes the exact same
-- workshop_responses/workshop_moves rows a live facilitator's deep-dive
-- would, so SummaryReport and the org rollup need no new rendering path for
-- the substance, only a provenance flag and a session-level narrative.

alter table public.workshop_sessions drop constraint if exists workshop_sessions_mode_check;
alter table public.workshop_sessions add constraint workshop_sessions_mode_check check (mode in ('live', 'async', 'ai'));

-- Session-level synthesis, written once when the organizer generates the
-- report: { headline, narrative, model, generatedAt }. Stored rather than
-- recomputed on every view so it's cheap to also surface in the org-wide
-- rollup (OrgRollupView) for a human moderator overseeing many units.
alter table public.workshop_sessions add column if not exists ai_summary jsonb;

-- Per-participant interview transcript ([{role,text}]) and completion flag,
-- so a participant who leaves mid-interview and comes back resumes rather
-- than restarts, and the organizer can see how many are actually done.
alter table public.workshop_participants add column if not exists ai_interview jsonb not null default '[]';
alter table public.workshop_participants add column if not exists ai_interview_done boolean not null default false;

-- Provenance only -- an AI-authored response/move is written through the
-- exact same insertResponse()/addMove() calls a human would use, just
-- flagged so the UI can label it rather than pass it off as a human's words.
alter table public.workshop_responses add column if not exists ai_generated boolean not null default false;
alter table public.workshop_moves add column if not exists ai_generated boolean not null default false;

-- Existing RLS policies on all four tables already use `using (true)` /
-- `with check (true)` for the anon role -- no policy changes needed for the
-- new columns.
