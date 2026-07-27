import { useMemo } from 'react'
import { ReactFlow, Background, Controls, MiniMap, Handle, Position, BaseEdge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { layoutOrgFlow } from '../orgFlowLayout'

// Two separate things had to be undone here to make box content clickable.
// First, React Flow's base stylesheet sets .react-flow__node { pointer-
// events: none } and only re-enables it via a .draggable/.selectable class
// -- which we never get since nodesDraggable/elementsSelectable are off
// globally (nothing in this tree should be manually rearranged), so every
// click was silently swallowed by the pane underneath. pointerEvents:
// 'auto' here overrides that for this node's own content. Second, "nodrag
// nopan" is React Flow's documented escape hatch for the OTHER half of the
// same problem: even with pointer-events restored, it still captures
// pointerdown to tell a click apart from a drag/pan gesture -- these classes
// tell it to leave this content alone.
//
// Plain default top/bottom handles -- extra-parent links get their own
// routing (SideLinkEdge below) without needing any handles of their own.
//
// height (not minHeight) on this wrapper matters: min-height makes THIS
// div at least data.height tall, but per the CSS spec it does NOT give
// descendants a definite height to resolve percentages against -- so a
// caller box using height:'100%' (every renderNode does) silently
// collapsed to its own content's natural size instead of filling the
// space dagre actually reserved for it. The visible box ended up much
// shorter than the invisible layout box the connector lines attach to,
// which read as a disconnected floating line segment even though the
// lines themselves were positioned correctly all along.
function OrgUnitNode({ data }) {
  return (
    <>
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <div className="nodrag nopan" style={{ width: data.width, height: data.height, cursor: 'default', pointerEvents: 'auto' }}>
        {data.renderNode(data.unit)}
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </>
  )
}

// Both edge components use edge.data's sx/sy/tx/ty (computed once in
// orgFlowLayout.js from the same node-position map the boxes are placed
// from) rather than the sourceX/sourceY/targetX/targetY props React Flow
// passes in -- functionally equivalent once the real bug above was found,
// but keeping this self-contained means neither edge's geometry depends on
// how React Flow resolves handle positions for a custom node.
function PrimaryEdge({ data, style }) {
  const { sx, sy, tx, ty } = data
  const midY = (sy + ty) / 2
  const path = `M${sx},${sy} V${midY} H${tx} V${ty}`
  return <path d={path} fill="none" style={style} />
}

// Routes an extra-parent link through a lane to the right of BOTH
// endpoints, rather than a straight line between them -- the straight line
// is what broke: whenever the two ends happened to land in the same
// column (routine at any real tree depth), it drew right on top of the
// primary tree's vertical trunk.
function SideLinkEdge({ data, style }) {
  const { sx, sy, tx, ty, boxWidth } = data
  const laneX = Math.max(sx, tx) + (boxWidth ?? 200) / 2 + 32
  const path = `M${sx},${sy} L${laneX},${sy} L${laneX},${ty} L${tx},${ty}`
  return <BaseEdge path={path} style={style} />
}

const nodeTypes = { orgUnit: OrgUnitNode }
const edgeTypes = { primary: PrimaryEdge, sideLink: SideLinkEdge }

// Renders any org unit tree as boxes-and-lines on a real pan/zoom canvas --
// React Flow (MIT) handles layout-independent edge routing, zoom/pan, and a
// minimap for free, replacing a hand-rolled SVG renderer that fought with
// the same "line cuts through a box" problem repeatedly as the org chart
// grew. Box content is fully supplied by the caller via renderNode, exactly
// like the component this replaces -- only the rendering engine changed.
export default function OrgFlowCanvas({ units, boxWidth = 220, boxHeight = 120, renderNode, extraConnectors = [] }) {
  const { nodes, edges, totalHeight } = useMemo(
    () => layoutOrgFlow(units, extraConnectors, { boxWidth, boxHeight }),
    [units, extraConnectors, boxWidth, boxHeight],
  )

  const flowNodes = useMemo(
    () => nodes.map((n) => ({ ...n, data: { ...n.data, renderNode, width: boxWidth, height: boxHeight } })),
    [nodes, renderNode, boxWidth, boxHeight],
  )

  const height = Math.max(360, Math.min(totalHeight + 96, 720))

  return (
    <div style={{ width: '100%', height, border: '1px solid var(--ws-border-soft)', borderRadius: 'var(--ws-radius-lg)', overflow: 'hidden' }}>
      <style>{'.react-flow__handle{opacity:0;pointer-events:none}.react-flow__attribution{opacity:.55;font-size:9px}'}</style>
      <ReactFlow
        nodes={flowNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll={false}
        zoomOnScroll={false}
        fitView
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background color="var(--ws-border-soft)" gap={28} size={1} />
        <Controls showInteractive={false} position="top-right" />
        {units.length > 8 && <MiniMap pannable zoomable style={{ background: 'var(--ws-surface)' }} maskColor="rgba(0,0,0,0.06)" />}
      </ReactFlow>
    </div>
  )
}
