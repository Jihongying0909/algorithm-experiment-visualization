interface Props { value: string; onChange: (v: string) => void }
export default function AlgorithmSelector({ value, onChange }: Props) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="px-2 py-2 rounded-lg border border-slate-200"><option value="bruteforce">蛮力递归</option><option value="topdown">自顶向下 DP</option><option value="bottomup">自底向上 DP</option><option value="reach">一维优化 reach</option></select>;
}
