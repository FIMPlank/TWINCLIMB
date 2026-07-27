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

  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', nodesep: 32, ranksep: 56, marginx: 24, marginy: 24 })
  g.setDefaultEdgeLabel(() => ({}))

  units.forEach((u) => g.setNode(u.id, { width: boxWidth, height: boxHeight }))
  units.forEach((u) => {
    if (u.parent_unit_id) g.setEdge(u.parent_unit_id, u.id)
  })

  dagre.layout(g)

  const nodes = units.map((u) => {
    const n = g.node(u.id)
    return {
      id: u.id,
      type: 'orgUnit',
      position: { x: n.x - boxWidth / 2, y: n.y - boxHeight / 2 },
      data: { unit: u },
      draggable: false,
    }
  })

  const primaryEdges = units
    .filter((u) => u.parent_unit_id)
    .map((u) => ({
      id: `${u.parent_unit_id}-${u.id}`,
      source: u.parent_unit_id,
      target: u.id,
      type: 'smoothstep',
      style: { stroke: 'var(--ws-border-soft)', strokeWidth: 1.5 },
    }))

  const extraEdges = extraConnectors.map(({ parentId, childId }) => ({
    id: `extra-${parentId}-${childId}`,
    source: parentId,
    target: childId,
    type: 'smoothstep',
    style: { stroke: 'var(--ws-brand)', strokeWidth: 1.5, strokeDasharray: '5 4' },
  }))

  const { width: totalWidth, height: totalHeight } = g.graph()

  return { nodes, edges: [...primaryEdges, ...extraEdges], totalWidth, totalHeight }
}
