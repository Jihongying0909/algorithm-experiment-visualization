import { Step } from '../types';
import ReachArrayView from './ReachArrayView';

export default function BottomUpTableView({ step, tab, setTab }: { step: Step; tab: 'table' | 'reach'; setTab: (v: 'table' | 'reach') => void }) {
  const dp = step.dpTable ?? [];
  const fallbackReach = Array.from({ length: Math.max(2, step.currentState.eggs + 1) }, () => 0);
  const reachLikeStep: Step = { ...step, reach: step.reach ?? fallbackReach, best: step.best ?? 0 };

  return (
    <div>
      <div className="text-lg font-semibold soft-title mb-2">动态规划过程</div>
      <div className="warm-subcard p-3 mb-3 text-xs text-[#5a5075] leading-6">
        <div className="font-mono">{'dp[e][f] = min_{1 <= x <= f}(1 + max(dp[e-1][x-1], dp[e][f-x]))'}</div>
        <div className="font-mono mt-1">reach[k] = reach[k] + reach[k-1] + 1</div>
        <div className="mt-1">当前状态：e={step.currentState.eggs}, f={step.currentState.floors}, x={step.x ?? '-'}</div>
      </div>

      <div className="mb-3">
        <button onClick={() => setTab('table')} className={`px-3 py-1 rounded-xl mr-2 border ${tab === 'table' ? 'soft-purple' : 'bg-[#FFF8F0] border-[#E7D9C8] text-[#7C6A5D]'}`}>二维 DP 表</button>
        <button onClick={() => setTab('reach')} className={`px-3 py-1 rounded-xl border ${tab === 'reach' ? 'soft-blue' : 'bg-[#FFF8F0] border-[#E7D9C8] text-[#7C6A5D]'}`}>一维 Reach</button>
      </div>

      {tab === 'table' ? (
        <>
          <div className="overflow-auto max-h-[440px] warm-subcard p-2">
            <table className="text-xs border-collapse">
              <thead>
                <tr>
                  <th className="border border-[#E7D9C8] px-2 py-1 text-[#7a6f98]">e\f</th>
                  {dp[0]?.map((_, j) => (
                    <th key={j} className="border border-[#E7D9C8] px-2 py-1 text-[#7a6f98] min-w-8">{j}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dp.map((r, i) => (
                  <tr key={i}>
                    <th className="border border-[#E7D9C8] px-2 py-1 text-[#7a6f98]">{i}</th>
                    {r.map((c, j) => {
                      const isCurrent = step.currentState.eggs === i && step.currentState.floors === j;
                      const isDepA = step.x !== undefined && i === step.currentState.eggs - 1 && j === step.x - 1;
                      const isDepB = step.x !== undefined && i === step.currentState.eggs && j === step.currentState.floors - step.x;
                      return (
                        <td
                          key={j}
                          className={`border px-2 py-1 transition-colors duration-300 min-w-8 text-center ${
                            isCurrent
                              ? 'bg-[#fce7f3] border-[#f5cfe4] font-semibold'
                              : isDepA
                                ? 'bg-[#efe9ff] border-[#ddd0ff]'
                                : isDepB
                                  ? 'bg-[#e8f2ff] border-[#cfe0ff]'
                                  : 'bg-[#FFFDF9] border-[#E7D9C8]'
                          }`}
                        >
                          {c}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-2 flex flex-wrap gap-3 text-xs soft-sub">
            <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded bg-[#fce7f3] border border-[#f5cfe4]" />当前计算格</span>
            <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded bg-[#efe9ff] border border-[#ddd0ff]" />依赖 dp[e-1][x-1]</span>
            <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded bg-[#e8f2ff] border border-[#cfe0ff]" />依赖 dp[e][f-x]</span>
          </div>
        </>
      ) : (
        <ReachArrayView step={reachLikeStep} compact />
      )}
    </div>
  );
}
