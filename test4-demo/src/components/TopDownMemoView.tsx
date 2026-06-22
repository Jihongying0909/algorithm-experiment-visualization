import { motion } from 'framer-motion';
import { Step } from '../types';

function parseStateKey(key: string) {
  const [e, f] = key.split(',').map((x) => Number(x));
  return { e, f };
}

export default function TopDownMemoView({ step }: { step: Step }) {
  const rows = Object.entries(step.memo ?? {});
  const stack = step.callStack ?? [];

  const maxE = Math.max(1, (step.heatmap?.length ?? 1) - 1);
  const maxF = Math.max(1, (step.heatmap?.[0]?.length ?? 1) - 1);

  const memoGrid: Array<Array<number | null>> = Array.from({ length: maxE + 1 }, () => Array(maxF + 1).fill(null));
  rows.forEach(([key, val]) => {
    const { e, f } = parseStateKey(key);
    if (e >= 0 && e <= maxE && f >= 0 && f <= maxF) memoGrid[e][f] = val.trials;
  });

  return (
    <div className="space-y-3 w-full">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-stretch w-full">
        <div className="warm-subcard p-3 min-h-[320px]">
          <div className="text-lg font-semibold soft-title mb-2">递归路径（带记忆化）</div>
          <div className="overflow-auto max-h-[260px] pr-1">
            {stack.length === 0 ? (
              <div className="text-xs soft-sub">当前没有递归调用。</div>
            ) : (
              <div className="space-y-2">
                {stack.map((node, i) => (
                  <div key={`${node}-${i}`} className="flex items-center gap-2" style={{ marginLeft: `${i * 14}px` }}>
                    <span className={`px-2 py-1 rounded-lg border text-xs ${i === stack.length - 1 ? 'soft-pink' : 'soft-blue'}`}>
                      {node}
                    </span>
                    {i < stack.length - 1 && <span className="text-xs soft-sub">→</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="warm-subcard p-3 min-h-[320px]">
          <div className="text-lg font-semibold soft-title mb-2">Memo 列表</div>
          <div className="grid grid-cols-4 gap-2 text-[11px] soft-sub mb-2 px-1">
            <span>(K,N)</span><span>最少次数</span><span>首投楼层</span><span>状态</span>
          </div>
          <div className="overflow-auto max-h-[260px] pr-1">
            {rows.map(([k, v]) => {
              const { e, f } = parseStateKey(k);
              return (
                <motion.div
                  key={k}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`grid grid-cols-4 gap-2 text-xs p-2 mb-1 rounded-lg border ${v.status === 'hit' ? 'bg-[#fce7f3] border-[#f5cfe4]' : 'bg-[#FFFDF9] border-[#E7D9C8]'}`}
                >
                  <span>({e},{f})</span>
                  <span>{v.trials}</span>
                  <span>{v.floor}</span>
                  <span className={v.status === 'hit' ? 'text-[#8a4f73]' : 'text-[#5f4c95]'}>{v.status === 'hit' ? '缓存命中' : '新计算'}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="warm-subcard p-3">
        <div className="text-lg font-semibold soft-title mb-2">TopDown 二维 DP/Memo 表</div>
        <div className="text-xs soft-sub mb-2">纵轴是 e(鸡蛋数)，横轴是 f(楼层数)。有值表示该状态已被计算并写入缓存。</div>
        <div className="overflow-auto max-h-[260px]">
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th className="border border-[#E7D9C8] px-2 py-1 text-[#7a6f98]">e\f</th>
                {Array.from({ length: maxF + 1 }, (_, f) => (
                  <th key={f} className="border border-[#E7D9C8] px-2 py-1 text-[#7a6f98] min-w-8">{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {memoGrid.map((row, e) => (
                <tr key={e}>
                  <th className="border border-[#E7D9C8] px-2 py-1 text-[#7a6f98]">{e}</th>
                  {row.map((v, f) => {
                    const isCurrent = e === step.currentState.eggs && f === step.currentState.floors;
                    return (
                      <td key={`${e}-${f}`} className={`border border-[#E7D9C8] px-2 py-1 text-center min-w-8 ${isCurrent ? 'bg-[#e8f2ff] text-[#2d4f77] font-semibold' : v !== null ? 'bg-[#fce7f3] text-[#7a4a69]' : 'bg-[#FFFDF9] text-[#b3aac8]'}`}>
                        {v ?? '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex gap-3 text-xs soft-sub">
          <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded bg-[#e8f2ff] border border-[#60a5fa]" />当前状态</span>
          <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded bg-[#fce7f3] border border-[#f5cfe4]" />已缓存状态</span>
        </div>
      </div>
    </div>
  );
}
