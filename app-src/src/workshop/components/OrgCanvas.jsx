import { layoutOrgTree } from '../orgLayout'

// Renders any org unit tree as boxes-and-lines, the shape people actually
// expect from "organigram" -- a horizontally scrollable canvas instead of an
// indented list, so which sub-units sit under which parent is visible at a
// glance rather than inferred from indentation. Box content is fully
// supplied by the caller (the builder needs forms and links, the rollup
// view needs a radar) -- this only owns the layout and the connector lines.
//
// Extra-parent links (a unit shared by more than one parent, from
// org_unit_links) ARE drawn here, alongside the primary tree. A direct
// line between two arbitrary boxes doesn't scale on its own -- at dozens of
// departments it starts cutting through whichever box happens to sit
// between them -- so instead of a bowed curve through the tree's interior,
// every extra link routes through the horizontal gaps between rows (which
// never contain a box, at any x) and, when the two ends are on different
// rows, a shared vertical lane just past the right edge of the whole chart
// (which never contains a box either, since no box's x ever reaches past
// totalWidth). That combination can't cut through a box regardless of how
// many departments or how many links exist -- it's a property of the route,
// not a heuristic tuned to a particular case. To keep dozens of links from
// turning into visual noise, an inactive link is drawn thin and faint;
// passing `highlightedUnitId` (the selected/hovered unit) makes its own
// links bold and dims the rest.
export default function OrgCanvas({ units, boxWidth = 220, boxHeight = 120, renderNode, links = [], highlightedUnitId = null }) {
  const { positions, connectors, totalWidth, totalHeight, vGap } = layoutOrgTree(units, { boxWidth, boxHeight })
  const pad = 16
  const px = (v) => v + pad

  const validLinks = links.filter((l) => positions[l.unit_id] && positions[l.parent_unit_id])
  const crossRowCount = validLinks.filter((l) => positions[l.unit_id].depth !== positions[l.parent_unit_id].depth).length
  const laneMargin = crossRowCount > 0 ? 24 + crossRowCount * 8 : 0
  const bottomReserve = validLinks.length > 0 ? vGap : 0

  let laneIndex = 0
  const extraLinkPaths = validLinks.map((l, i) => {
    const a = positions[l.unit_id]
    const b = positions[l.parent_unit_id]
    const bottomA = a.y + a.height
    const bottomB = b.y + b.height
    const gapYA = bottomA + vGap / 2
    const gapYB = bottomB + vGap / 2
    const isActive = highlightedUnitId != null && (highlightedUnitId === l.unit_id || highlightedUnitId === l.parent_unit_id)

    let d
    if (a.depth === b.depth) {
      // Same row: the gap directly below both boxes is one continuous,
      // box-free band, so a straight run through it is already safe -- no
      // need for the side lane.
      d = `M${px(a.cx)},${px(bottomA)} L${px(a.cx)},${px(gapYA)} L${px(b.cx)},${px(gapYA)} L${px(b.cx)},${px(bottomB)}`
    } else {
      const laneX = px(totalWidth) + 24 + laneIndex * 8
      laneIndex += 1
      d = `M${px(a.cx)},${px(bottomA)} L${px(a.cx)},${px(gapYA)} L${laneX},${px(gapYA)} L${laneX},${px(gapYB)} L${px(b.cx)},${px(gapYB)} L${px(b.cx)},${px(bottomB)}`
    }
    return { key: `${l.unit_id}-${l.parent_unit_id}-${i}`, d, isActive }
  })

  const svgWidth = totalWidth + pad * 2 + laneMargin
  const svgHeight = totalHeight + pad * 2 + bottomReserve

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ position: 'relative', width: svgWidth, height: svgHeight, margin: '0 auto' }}>
        <svg width={svgWidth} height={svgHeight} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} aria-hidden="true">
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
          {extraLinkPaths.map(({ key, d, isActive }) => (
            <path
              key={key}
              d={d}
              fill="none"
              stroke="var(--ws-brand)"
              strokeWidth={isActive ? 2 : 1.25}
              strokeDasharray="5 4"
              opacity={isActive ? 1 : highlightedUnitId != null ? 0.2 : 0.5}
            />
          ))}
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
