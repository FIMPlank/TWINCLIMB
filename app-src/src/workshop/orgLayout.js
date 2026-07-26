// Pure tree-layout math for the org chart canvas -- no DOM, no React, so the
// positions can be reasoned about on their own. Classic two-pass layout:
// measure every subtree's width bottom-up, then place every node left-to-
// right using those cached widths, centering each parent over its children.
// Small org charts (tens of units, not thousands) don't need anything more
// sophisticated than that, and it keeps this dependency-free.

function sortUnits(list) {
  return [...list].sort((a, b) => (a.sort_order - b.sort_order) || a.created_at.localeCompare(b.created_at))
}

export function layoutOrgTree(units, opts = {}) {
  const boxWidth = opts.boxWidth ?? 220
  const boxHeight = opts.boxHeight ?? 120
  const hGap = opts.hGap ?? 28
  const vGap = opts.vGap ?? 56

  const byParent = {}
  units.forEach((u) => { if (u.parent_unit_id) (byParent[u.parent_unit_id] ||= []).push(u) })
  Object.keys(byParent).forEach((k) => { byParent[k] = sortUnits(byParent[k]) })
  const roots = sortUnits(units.filter((u) => !u.parent_unit_id))

  const widthCache = new Map()
  function subtreeWidth(unit) {
    if (widthCache.has(unit.id)) return widthCache.get(unit.id)
    const children = byParent[unit.id] || []
    const w = children.length === 0
      ? boxWidth
      : Math.max(boxWidth, children.reduce((sum, c) => sum + subtreeWidth(c), 0) + hGap * (children.length - 1))
    widthCache.set(unit.id, w)
    return w
  }

  const positions = {}
  const connectors = []
  let maxDepth = 0

  function place(unit, depth, left) {
    maxDepth = Math.max(maxDepth, depth)
    const w = subtreeWidth(unit)
    const cx = left + w / 2
    const y = depth * (boxHeight + vGap)
    positions[unit.id] = { x: cx - boxWidth / 2, y, cx, cy: y + boxHeight / 2, width: boxWidth, height: boxHeight, depth }

    const children = byParent[unit.id] || []
    if (children.length === 0) return
    const totalChildWidth = children.reduce((sum, c) => sum + subtreeWidth(c), 0) + hGap * (children.length - 1)
    let childLeft = cx - totalChildWidth / 2
    children.forEach((c) => {
      place(c, depth + 1, childLeft)
      connectors.push({ parentId: unit.id, childId: c.id })
      childLeft += subtreeWidth(c) + hGap
    })
  }

  let rootLeft = 0
  roots.forEach((r) => {
    place(r, 0, rootLeft)
    rootLeft += subtreeWidth(r) + hGap
  })

  const totalWidth = Math.max(boxWidth, rootLeft - hGap)
  const totalHeight = (maxDepth + 1) * boxHeight + maxDepth * vGap

  return { positions, connectors, totalWidth, totalHeight, boxWidth, boxHeight, vGap }
}
