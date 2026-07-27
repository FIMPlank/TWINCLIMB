import dagre from 'dagre'

// Hands the primary parent/child tree to dagre for layout -- a mature,
// battle-tested layout engine instead of the hand-rolled two-pass algorithm
// this replaces. Extra-parent links (org_unit_links) are deliberately left
// OUT of the graph dagre lays out: they can point to any rank, and feeding
// them in would pull the primary tree's shape around to accommodate edges
// that are really a secondary annotation, not part of the hierarchy. They're
// rendered as ordinary React Flow edges between the resulting node
// positions afterwards, same as the primary edges just styled differently.
export function layoutOrgFlow(units, extraConnectors, opts = {}) {
  const boxWidth = opts.boxWidth ?? 220
  const boxHeight = opts.boxHeight ?? 120

  const idSet = new Set(units.map((u) => u.id))

  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', nodesep: 32, ranksep: 56, marginx: 24, marginy: 24 })
  g.setDefaultEdgeLabel(() => ({}))

  units.forEach((u) => g.setNode(u.id, { width: boxWidth, height: boxHeight }))
  units.forEach((u) => {
    // A parent_unit_id that doesn't resolve to a unit actually in this org
    // (e.g. a child left behind after its parent was deleted) must NOT be
    // handed to dagre -- setEdge auto-creates a same-named node for a
    // missing endpoint, and that invisible zero-size phantom distorts the
    // whole layout: extra rank space nothing renders into, and the orphaned
    // unit itself getting positioned relative to a "parent" that isn't
    // there. Treat it as a root instead -- still visible, just not
    // silently warping everyone else's spacing.
    if (u.parent_unit_id && idSet.has(u.parent_unit_id)) g.setEdge(u.parent_unit_id, u.id)
  })

  dagre.layout(g)

  // Own, trusted record of every node's box -- used both to place the
  // nodes themselves and to compute every edge's exact endpoints (below),
  // so both stay consistent with the same single source of truth instead
  // of edges depending on however React Flow resolves handle positions for
  // a custom node type.
  const positions = {}
  units.forEach((u) => {
    const n = g.node(u.id)
    positions[u.id] = { x: n.x - boxWidth / 2, y: n.y - boxHeight / 2, cx: n.x }
  })

  const nodes = units.map((u) => ({
    id: u.id,
    type: 'orgUnit',
    position: { x: positions[u.id].x, y: positions[u.id].y },
    width: boxWidth,
    height: boxHeight,
    data: { unit: u },
    draggable: false,
  }))

  const anchors = (parentId, childId) => ({
    sx: positions[parentId].cx,
    sy: positions[parentId].y + boxHeight,
    tx: positions[childId].cx,
    ty: positions[childId].y,
  })

  const primaryEdges = units
    .filter((u) => u.parent_unit_id && idSet.has(u.parent_unit_id))
    .map((u) => ({
      id: `${u.parent_unit_id}-${u.id}`,
      source: u.parent_unit_id,
      target: u.id,
      type: 'primary',
      data: anchors(u.parent_unit_id, u.id),
      style: { stroke: 'var(--ws-border-soft)', strokeWidth: 1.5 },
    }))

  // Extra-parent links use a dedicated custom edge (see OrgFlowCanvas's
  // SideLinkEdge) that computes its own detour path -- a straight line
  // between the two boxes drew right on top of the primary tree's trunk
  // whenever both ends happened to land in the same column (routine at any
  // real tree depth). boxWidth lets it size its sideways detour to
  // reliably clear a box that happens to sit in the same column.
  const extraEdges = extraConnectors
    .filter(({ parentId, childId }) => idSet.has(parentId) && idSet.has(childId))
    .map(({ parentId, childId }) => ({
      id: `extra-${parentId}-${childId}`,
      source: parentId,
      target: childId,
      type: 'sideLink',
      data: { ...anchors(parentId, childId), boxWidth },
      style: { stroke: 'var(--ws-brand)', strokeWidth: 1.5, strokeDasharray: '5 4' },
    }))

  const { width: totalWidth, height: totalHeight } = g.graph()

  return { nodes, edges: [...primaryEdges, ...extraEdges], totalWidth, totalHeight }
}
