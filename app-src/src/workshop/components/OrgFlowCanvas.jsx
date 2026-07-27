import { useMemo } from 'react'
import { ReactFlow, Background, Controls, MiniMap, Handle, Position } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { layoutOrgFlow } from '../orgFlowLayout'

// Connection points are only there so edges have somewhere to attach --
// nothing here is meant to be manually wired up, so they're invisible
// (hidden below) rather than the little colored dots React Flow shows by
// default on a diagram-editing canvas.
//
// Two separate things had to be undone here to make box content clickable
// again. First, React Flow's base stylesheet sets .react-flow__node {
// pointer-events: none } and only re-enables it via a .draggable/.selectable
// class -- which we never get since nodesDraggable/elementsSelectable are
// off globally (nothing in this tree should be manually rearranged), so
// every click was silently swallowed by the pane underneath. pointerEvents:
// 'auto' here overrides that for this node's own content. Second, "nodrag
// nopan" is React Flow's documented escape hatch for the OTHER half of the
// same problem: even with pointer-events restored, it still captures
// pointerdown to tell a click apart from a drag/pan gesture -- these classes
// tell it to leave this content alone.
function OrgUnitNode({ data }) {
  return (
    <>
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <div className="nodrag nopan" style={{ width: data.width, minHeight: data.height, cursor: 'default', pointerEvents: 'auto' }}>
        {data.renderNode(data.unit)}
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </>
  )
}

const nodeTypes = { orgUnit: OrgUnitNode }

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
