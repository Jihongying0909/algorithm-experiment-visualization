import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LocateFixed, Minus, Plus } from 'lucide-react';
import { Step, TreeNode } from '../types';

type LayoutNode = TreeNode & { depth: number; yOrder: number };

const nodeStyle = (state: string) => {
  if (state === 'active') return { fill: '#e8f2ff', stroke: '#60a5fa' };
  if (state === 'done') return { fill: '#fce7f3', stroke: '#f472b6' };
  if (state === 'base') return { fill: '#efe9ff', stroke: '#a78bfa' };
  if (state === 'repeat') return { fill: '#fdf2f8', stroke: '#f9a8d4' };
  if (state === 'best') return { fill: '#e0f2fe', stroke: '#38bdf8' };
  return { fill: '#fcfbff', stroke: '#ddd6fe' };
};

const legendItems = [
  ['当前节点', '#e8f2ff', '#60a5fa'],
  ['已完成', '#fce7f3', '#f472b6'],
  ['边界节点', '#efe9ff', '#a78bfa'],
  ['重复子问题', '#fdf2f8', '#f9a8d4'],
  ['当前最优', '#e0f2fe', '#38bdf8'],
];

export default function BruteForceTree({ step }: { step: Step }) {
  const nodes = step.treeNodes ?? [];
  const edges = step.treeEdges ?? [];
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);

  const graph = useMemo(() => {
    if (!nodes.length) return null;
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const incoming = new Map<string, number>();
    const children = new Map<string, { id: string; label: 'broken' | 'safe' }[]>();
    const parent = new Map<string, string>();
    edges.forEach((e) => {
      incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
      const arr = children.get(e.from) ?? [];
      arr.push({ id: e.to, label: e.label });
      children.set(e.from, arr);
      parent.set(e.to, e.from);
    });

    const root = nodes.find((n) => !incoming.get(n.id))?.id ?? nodes[0].id;
    const ordered: LayoutNode[] = [];
    let cursor = 0;

    const dfs = (id: string, depth: number) => {
      const childrenList = children.get(id) ?? [];
      const sorted = [...childrenList.filter((c) => c.label === 'broken'), ...childrenList.filter((c) => c.label === 'safe')];
      const yOrder = cursor++;
      const n = byId.get(id);
      if (n) ordered.push({ ...n, depth, yOrder });
      sorted.forEach((c) => dfs(c.id, depth + 1));
    };
    dfs(root, 0);

    const currentLabel = `T(${step.currentState.eggs},${step.currentState.floors})`;
    const matched = ordered.filter((n) => n.label === currentLabel);
    const candidate = matched.length > 0 ? matched[matched.length - 1] : undefined;
    const focusId = candidate?.id ?? (ordered.length > 0 ? ordered[ordered.length - 1].id : root);

    const focusPath = new Set<string>();
    let w = focusId;
    while (w) {
      focusPath.add(w);
      w = parent.get(w) ?? '';
    }

    const xGap = ordered.length > 28 ? 170 : 190;
    const yGap = ordered.length > 28 ? 56 : 68;
    const leftPad = 80;
    const topPad = 28;
    const pos = new Map<string, { x: number; y: number }>();
    ordered.forEach((n) => pos.set(n.id, { x: leftPad + n.depth * xGap, y: topPad + n.yOrder * yGap }));

    const width = Math.max(900, ...ordered.map((n) => leftPad + n.depth * xGap + 220));
    const height = Math.max(520, ...ordered.map((n) => topPad + n.yOrder * yGap + 100));
    const focusPos = pos.get(focusId);

    return { ordered, pos, focusPath, focusId, focusPos, width, height, sparse: ordered.length > 28 };
  }, [nodes, edges, step.currentState.eggs, step.currentState.floors]);

  useEffect(() => {
    if (!graph?.focusPos || !viewportRef.current) return;
    const vp = viewportRef.current;
    const left = graph.focusPos.x * zoom - vp.clientWidth * 0.45;
    const top = graph.focusPos.y * zoom - vp.clientHeight * 0.35;
    vp.scrollTo({ left: Math.max(0, left), top: Math.max(0, top), behavior: 'smooth' });
  }, [graph?.focusId, graph?.focusPos, zoom]);

  if (!graph) return <div className="text-[#7a6f98]">递归树尚未生成。</div>;

  const visible = new Set<string>();
  if (graph.sparse) {
    graph.ordered.forEach((n) => {
      if (graph.focusPath.has(n.id) || n.id === graph.focusId || n.state === 'active') visible.add(n.id);
    });
    if (visible.size < 16) graph.ordered.slice(-20).forEach((n) => visible.add(n.id));
  } else {
    graph.ordered.forEach((n) => visible.add(n.id));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold soft-title">递归树（自动聚焦当前节点）</div>
        <div className="flex items-center gap-1">
          <button className="soft-blue px-2 py-1 rounded border text-xs" onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.1).toFixed(2)))}><Minus size={12} /></button>
          <span className="text-xs soft-sub w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button className="soft-blue px-2 py-1 rounded border text-xs" onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.1).toFixed(2)))}><Plus size={12} /></button>
          <button className="soft-purple px-2 py-1 rounded border text-xs flex items-center gap-1" onClick={() => setZoom(1)}><LocateFixed size={12} />重置</button>
        </div>
      </div>

      <div ref={viewportRef} className="warm-subcard p-2 overflow-auto h-[460px]">
        <svg width={graph.width * zoom} height={graph.height * zoom}>
          <g transform={`scale(${zoom})`}>
            {edges.map((e, i) => {
              if (!visible.has(e.from) || !visible.has(e.to)) return null;
              const a = graph.pos.get(e.from);
              const b = graph.pos.get(e.to);
              if (!a || !b) return null;
              const onPath = graph.focusPath.has(e.from) && graph.focusPath.has(e.to);
              const midX = (a.x + b.x) / 2;
              const midY = (a.y + b.y) / 2 + (e.label === 'broken' ? -11 : 11);
              const path = `M ${a.x + 60} ${a.y} C ${a.x + 98} ${a.y}, ${b.x - 98} ${b.y}, ${b.x - 60} ${b.y}`;
              return (
                <g key={`${e.from}-${e.to}-${i}`} opacity={onPath ? 0.98 : 0.26}>
                  <path d={path} fill="none" stroke={onPath ? '#7c6f98' : '#d6d1e4'} strokeWidth={onPath ? 2.2 : 1.6} />
                  {onPath && (
                    <>
                      <rect x={midX - 22} y={midY - 8} width={44} height={16} rx={8} fill={e.label === 'broken' ? '#fce7f3' : '#e8f2ff'} stroke={e.label === 'broken' ? '#f5cfe4' : '#cfe0ff'} />
                      <text x={midX} y={midY + 3} fontSize="9" textAnchor="middle" fill="#5f4c95">{e.label}</text>
                    </>
                  )}
                </g>
              );
            })}

            {graph.ordered.map((n) => {
              if (!visible.has(n.id)) return null;
              const p = graph.pos.get(n.id)!;
              const style = nodeStyle(n.state);
              const onPath = graph.focusPath.has(n.id);
              const isFocus = n.id === graph.focusId;
              return (
                <motion.g key={n.id} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: onPath ? 1 : 0.48, scale: isFocus ? 1.05 : 1 }} transition={{ duration: 0.2 }}>
                  <rect x={p.x - 60} y={p.y - 20} width={120} height={40} rx={11} fill={style.fill} stroke={style.stroke} strokeWidth={isFocus ? 2.4 : 1.3} style={isFocus ? { filter: 'drop-shadow(0 0 8px rgba(96,165,250,0.34))' } : {}} />
                  <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="12" fill="#43385a" fontWeight={600}>{n.label}</text>
                  {n.state === 'repeat' && (
                    <g>
                      <rect x={p.x + 26} y={p.y - 28} width={30} height={13} rx={6.5} fill="#f9a8d4" />
                      <text x={p.x + 41} y={p.y - 19} textAnchor="middle" fontSize="8" fill="#5f4c95">重复</text>
                    </g>
                  )}
                </motion.g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="warm-subcard p-3">
        <div className="text-sm soft-title font-semibold mb-2">图例</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          {legendItems.map(([name, bg, bd]) => (
            <div key={name} className="flex items-center gap-2 text-[#6A5648]">
              <span className="w-4 h-4 rounded-md border" style={{ background: bg, borderColor: bd }} />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
