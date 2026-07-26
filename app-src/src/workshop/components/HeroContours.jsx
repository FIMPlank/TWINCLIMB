// Abstract topographic contour lines + a single ascending route with a
// summit waypoint — the climb metaphor, rendered as lightweight inline SVG
// (no external assets, no stock imagery).
export default function HeroContours() {
  return (
    <svg className="ws-hero-contours" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g fill="none" stroke="var(--ws-brand-bright)" strokeWidth="1">
        <path opacity="0.18" d="M-20,420 C220,380 380,440 620,400 C860,362 980,410 1220,380" />
        <path opacity="0.14" d="M-20,460 C260,410 460,470 700,430 C900,398 1040,440 1220,415" />
        <path opacity="0.22" d="M-20,340 C200,300 420,350 640,310 C860,272 1000,320 1220,290" />
        <path opacity="0.12" d="M-20,260 C240,225 440,270 680,230 C900,196 1020,235 1220,205" />
      </g>
      <path d="M120,500 C220,380 300,300 420,230 C520,175 560,140 610,90" fill="none" stroke="var(--ws-brand-bright)" strokeWidth="1.5" strokeDasharray="3 7" opacity="0.5" />
      <circle cx="420" cy="230" r="4" fill="var(--ws-brand-bright)" opacity="0.6" />
      <circle cx="610" cy="90" r="5" fill="var(--ws-brand-bright)" opacity="0.8" />
      <path d="M610,90 L610,64" stroke="var(--ws-brand-bright)" strokeWidth="1.5" opacity="0.8" />
      <path d="M610,64 L634,72 L610,80 Z" fill="var(--ws-brand-bright)" opacity="0.8" />
    </svg>
  )
}
