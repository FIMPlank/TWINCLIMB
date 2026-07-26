import { layoutOrgTree } from '../orgLayout'

// Renders any org unit tree as boxes-and-lines, the shape people actually
// expect from "organigram" -- a horizontally scrollable canvas instead of an
// indented list, so which sub-units sit under which parent is visible at a
// glance rather than inferred from indentation. Box content is fully
// supplied by the caller (the builder needs forms and links, the rollup
// view needs a radar) -- this only owns the layout and the primary tree's
// connector lines.
//
// Extra-parent links (a unit shared by more than one parent) are
// deliberately NOT drawn as lines here -- a line from one box to another
// only reads cleanly for a handful of nearby units; at real org-chart scale
// (dozens of departments, links skipping several rows) it either cuts
// through unrelated boxes or turns into unreadable clutter. Callers surface
// those relationships instead via a badge plus their own text/highlight
// treatment (see OrgChartBuilder's link modal and OrgRollupView's
// selection-linked highlight), which costs nothing extra as the chart grows.
export default function OrgCanvas({ units, boxWidth = 220, boxHeight = 120, renderNode }) {
  const { positions, connectors, totalWidth, totalHeight } = layoutOrgTree(units, { boxWidth, boxHeight })
  const pad = 16

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ position: 'relative', width: totalWidth + pad * 2, height: totalHeight + pad * 2, margin: '0 auto' }}>
        <svg width={totalWidth + pad * 2} height={totalHeight + pad * 2} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} aria-hidden="true">
          {connectors.map(({ parentId, childId }) => {
            const p = positions[parentId]
            const c = positions[childId]
            if (!p || !c) return null
            const x1 = p.cx + pad, y1 = p.y + p.height + pad
            const x2 = c.cx + pad, y2 = c.y + pad
            const midY = (y1 + y2) / 2
            return (
              <path
                key={`${parentId}-${childId}`}
                d={`M${x1},${y1} V${midY} H${x2} V${y2}`}
                fill="none" stroke="var(--ws-border-soft)" strokeWidth="1.5"
              />
            )
          })}
        </svg>
        {units.map((u) => {
          const pos = positions[u.id]
          if (!pos) return null
          return (
            <div key={u.id} style={{ position: 'absolute', left: pos.x + pad, top: pos.y + pad, width: pos.width, minHeight: pos.height }}>
              {renderNode(u, pos)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
