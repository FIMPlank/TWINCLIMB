import { layoutOrgTree } from '../orgLayout'

// An extra-parent link can skip straight over one or more whole rows of the
// tree (e.g. a grandchild linking up to the root) -- a fixed small bow only
// looks right when there's nothing in between. Widen the bow sideways just
// enough to clear any box that actually sits between the two endpoints
// (by row and by x-range), picking whichever side needs the smaller detour;
// with a clear path it falls back to the original gentle upward bow.
function extraConnectorPath(childPos, parentPos, units, positions, pad) {
  const x1 = childPos.cx + pad, y1 = childPos.cy + pad
  const x2 = parentPos.cx + pad, y2 = parentPos.cy + pad
  const yLo = Math.min(y1, y2), yHi = Math.max(y1, y2)
  const corridorMin = Math.min(x1, x2), corridorMax = Math.max(x1, x2)

  let obsMin = null, obsMax = null
  units.forEach((u) => {
    const pos = positions[u.id]
    if (!pos || pos === childPos || pos === parentPos) return
    const cy = pos.cy + pad
    if (cy <= yLo || cy >= yHi) return // not a row strictly between the two endpoints
    const left = pos.x + pad, right = left + pos.width
    if (right < corridorMin || left > corridorMax) return // doesn't sit in the direct path
    obsMin = obsMin === null ? left : Math.min(obsMin, left)
    obsMax = obsMax === null ? right : Math.max(obsMax, right)
  })

  if (obsMin === null) {
    const bendY = yLo - 26
    return `M${x1},${y1} Q${(x1 + x2) / 2},${bendY} ${x2},${y2}`
  }

  const margin = 30
  const midX = (x1 + x2) / 2
  const clearRight = obsMax + margin
  const clearLeft = obsMin - margin
  // A quadratic curve only reaches about half its control point's offset
  // from the straight line at the midpoint -- double the target so the
  // curve itself (not just the control point) actually clears the box.
  const bendX = (clearRight - midX) <= (midX - clearLeft)
    ? 2 * clearRight - midX
    : 2 * clearLeft - midX
  const midY = (y1 + y2) / 2
  return `M${x1},${y1} Q${bendX},${midY} ${x2},${y2}`
}

// Renders any org unit tree as boxes-and-lines, the shape people actually
// expect from "organigram" -- a horizontally scrollable canvas instead of an
// indented list, so which sub-units sit under which parent is visible at a
// glance rather than inferred from indentation. Box content is fully
// supplied by the caller (the builder needs forms and links, the rollup
// view needs a radar) -- this only owns the layout and the connector lines.
export default function OrgCanvas({ units, boxWidth = 220, boxHeight = 120, renderNode, extraConnectors = [] }) {
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
          {/* Extra-parent links (a unit shared by more than one parent) can
              connect boxes anywhere on the canvas, not just a row directly
              above/below -- a plain curved line, visually distinct (dashed,
              brand color) from the tree's solid elbow connectors. */}
          {extraConnectors.map(({ parentId, childId }) => {
            const p = positions[parentId]
            const c = positions[childId]
            if (!p || !c) return null
            return (
              <path
                key={`extra-${parentId}-${childId}`}
                d={extraConnectorPath(c, p, units, positions, pad)}
                fill="none" stroke="var(--ws-brand)" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.65"
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
