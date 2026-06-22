import { Step } from '../types';

function lineExplain(step?: Step) {
  if (!step) return '等待开始。';
  const { pseudoLine, x, broken, safe, worst, best, bestFloor, currentState } = step;
  const k = currentState.eggs;
  const n = currentState.floors;
  const map: Record<number, string> = {
    1: `检查边界 N=0。当前状态 T(${k},${n})。`,
    2: '检查边界 N=1。',
    3: '检查边界 K=1（只能线性扫描）。',
    4: '初始化 minTrials / bestTrials 为无穷大。',
    5: '初始化 bestFloor 为 1。',
    6: `进入循环枚举 x，当前 x=${x ?? '-' }。`,
    7: `计算 broken 分支，进入 T(K-1,x-1)，当前 x=${x ?? '-' }。`,
    8: `计算 safe 分支，进入 T(K,N-x)，当前 x=${x ?? '-' }。`,
    9: `计算 worst = 1 + max(broken, safe) = 1 + max(${broken ?? '-'}, ${safe ?? '-'}) = ${worst ?? '-' }。`,
    10: `比较 worst 与当前最优：worst=${worst ?? '-'}，best=${best ?? '-' }。`,
    11: `更新最优次数为 ${best ?? '-' }。`,
    12: `更新最优首投楼层为 ${bestFloor ?? '-' }。`,
    13: `返回结果 (${best ?? step.returnValue ?? '-'}, ${bestFloor ?? '-'})。`,
    14: '写入 memo 或 dp 表。',
    15: '写入 choice / 返回 memo。',
    16: '返回最终 DP 结果。',
  };
  return map[pseudoLine] ?? step.description;
}

export default function StepExplanation({ step }: { step?: Step }) {
  const logs = step?.logs ?? [];
  const latest = logs.slice(-3);

  return (
    <div className="warm-card bg-[#FFF8F0] p-4">
      <div className="text-sm font-semibold soft-title">当前步骤解释</div>
      <div className="mt-2 text-sm text-[#4B3A2F] leading-7">{lineExplain(step)}</div>
      <div className="mt-3 warm-subcard p-2">
        <div className="text-xs soft-sub mb-1">最近日志</div>
        {latest.length === 0 ? (
          <div className="text-xs text-[#7a6f98]">-</div>
        ) : latest.map((l, i) => <div key={`${l}-${i}`} className="text-xs text-[#5d5378] leading-6">{l}</div>)}
      </div>
    </div>
  );
}
