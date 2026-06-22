export type AlgoType = 'bruteforce' | 'topdown' | 'bottomup' | 'reach';

export type NodeState = 'active' | 'done' | 'base' | 'repeat' | 'best' | 'idle' | 'hit';

export interface TreeNode {
  id: string;
  label: string;
  x: number;
  y: number;
  state: NodeState;
}

export interface TreeEdge {
  from: string;
  to: string;
  label: 'broken' | 'safe';
}

export interface Step {
  id: number;
  algorithm: AlgoType;
  pseudoLine: number;
  description: string;
  action: string;
  currentState: { eggs: number; floors: number };
  x?: number;
  broken?: number;
  safe?: number;
  worst?: number;
  best?: number;
  bestFloor?: number;
  returnValue?: number;
  treeNodes?: TreeNode[];
  treeEdges?: TreeEdge[];
  memo?: Record<string, { trials: number; floor: number; status: 'new' | 'hit' }>;
  dpTable?: number[][];
  choiceTable?: number[][];
  reach?: number[];
  heatmap?: number[][];
  callStack?: string[];
  logs?: string[];
  metrics?: {
    calls: number;
    hits: number;
    states: number;
    filled: number;
  };
  status?: 'Ready' | 'Running' | 'Paused' | 'Finished';
}

export interface PseudoLine {
  line: number;
  text: string;
  tip: string;
}
