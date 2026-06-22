import { AlgoType, Step } from '../types';
import { BarChart3, BookOpen, FlaskConical, Sigma } from 'lucide-react';

function metric(step?: Step) {
  const calls = step?.metrics?.calls ?? 0;
  const states = step?.metrics?.states ?? 0;
  const hits = step?.metrics?.hits ?? 0;
  const repeat = Math.max(0, calls - states);
  const rate = calls > 0 ? ((repeat / calls) * 100).toFixed(1) : '0.0';
  return { calls, states, hits, repeat, rate };
}

function formulaByAlgo(algorithm: AlgoType) {
  if (algorithm === 'bottomup') {
    return 'dp[e][f] = min_{1 <= x <= f}(1 + max(dp[e-1][x-1], dp[e][f-x]))';
  }
  if (algorithm === 'topdown') {
    return 'T(K,N) = min_{1 <= x <= N}(1 + max(T(K-1,x-1), T(K,N-x))) + memo';
  }
  if (algorithm === 'reach') {
    return 'reach[k] = reach[k] + reach[k-1] + 1';
  }
  return 'T(K,N) = min_{1 <= x <= N}(1 + max(T(K-1,x-1), T(K,N-x)))';
}

export default function TeachingContent({ step, algorithm }: { step?: Step; algorithm: AlgoType }) {
  const m = metric(step);
  const formula = formulaByAlgo(algorithm);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-3 w-full">
      <div className="warm-card p-4 w-full h-full">
        <div className="flex items-center gap-2 soft-title text-lg font-semibold mb-2">
          <BookOpen size={18} />
          问题背景说明
        </div>
        <p className="text-sm text-[#5a5075] leading-7">
          目标：在最坏情况下用最少次数确定门槛楼层 F。若从楼层 x 投掷鸡蛋，x &gt; F 会碎，x &lt;= F 不碎。
        </p>
        <div className="mt-3 warm-subcard p-2 text-sm flex flex-wrap gap-2">
          <span className="px-2 py-1 rounded soft-blue border">安全区间 1..F</span>
          <span className="px-2 py-1 rounded soft-purple border">门槛层 F</span>
          <span className="px-2 py-1 rounded soft-pink border">危险区间 F+1..N</span>
        </div>
      </div>

      <div className="warm-card p-4 w-full h-full">
        <div className="flex items-center gap-2 soft-title text-lg font-semibold mb-2">
          <Sigma size={18} />
          核心递推公式
        </div>
        <div className="warm-subcard p-3 font-['Cambria_Math','Times_New_Roman',serif] text-[20px] leading-[1.25] text-[#3f355b] overflow-auto">
          <span className="whitespace-nowrap">{formula}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded soft-pink border">T(K-1,x-1)：鸡蛋碎</span>
          <span className="px-2 py-1 rounded soft-blue border">T(K,N-x)：鸡蛋未碎</span>
          <span className="px-2 py-1 rounded soft-purple border">max：最坏情况</span>
          <span className="px-2 py-1 rounded soft-purple border">min：选择最优楼层</span>
        </div>
      </div>

      <div className="warm-card p-4 w-full h-full">
        <div className="flex items-center gap-2 soft-title text-lg font-semibold mb-2">
          <BarChart3 size={18} />
          三种算法对比说明
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div className="warm-subcard p-2">
            <div className="font-semibold">蛮力递归</div>
            <div>直接枚举，不保存结果，重复计算多。</div>
            <span className="inline-block mt-1 px-2 py-0.5 rounded soft-pink border">指数级</span>
          </div>
          <div className="warm-subcard p-2">
            <div className="font-semibold">自顶向下 DP</div>
            <div>递归 + memo 缓存，避免重复计算。</div>
            <span className="inline-block mt-1 px-2 py-0.5 rounded soft-blue border">O(KN²)</span>
          </div>
          <div className="warm-subcard p-2">
            <div className="font-semibold">自底向上 DP</div>
            <div>二维填表，从小问题推到大问题。</div>
            <span className="inline-block mt-1 px-2 py-0.5 rounded soft-purple border">O(KN²)</span>
          </div>
        </div>
      </div>

      <div className="warm-card p-4 w-full h-full">
        <div className="soft-title text-lg font-semibold mb-2">重复子问题观察区</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="warm-subcard p-2">总调用次数<div className="text-lg font-semibold">{m.calls}</div></div>
          <div className="warm-subcard p-2">不同状态数<div className="text-lg font-semibold">{m.states}</div></div>
          <div className="warm-subcard p-2">重复计算次数<div className="text-lg font-semibold text-[#8a4f73]">{m.repeat}</div></div>
          <div className="warm-subcard p-2">重复率<div className="text-lg font-semibold">{m.rate}%</div></div>
          <div className="warm-subcard p-2 col-span-2">缓存命中次数<div className="text-lg font-semibold text-[#44638f]">{m.hits}</div></div>
        </div>
      </div>

      <div className="warm-card p-4 w-full h-full">
        <div className="flex items-center gap-2 soft-title text-lg font-semibold mb-2">
          <FlaskConical size={18} />
          实验结果与最大规模
        </div>
        <div className="text-sm leading-7 text-[#5a5075]">
          <div>{'蛮力法：E <= 12, F <= 16'}</div>
          <div>{'自顶向下 DP：E <= 12, F <= 1743'}</div>
          <div>{'自底向上 DP：E <= 12, F <= 2767'}</div>
          <div className="mt-1 soft-sub">{'条件：单组时间阈值 10 秒，F 搜索上限 5000。'}</div>
        </div>
      </div>

      <div className="warm-card p-4 w-full h-full">
        <div className="soft-title text-lg font-semibold mb-2">学习小结</div>
        <ul className="text-sm leading-7 text-[#5a5075] list-disc pl-4">
          <li>蛮力法重复子问题严重。</li>
          <li>自顶向下 DP 利用缓存显著减少重复计算。</li>
          <li>自底向上 DP 通过填表使每个状态只计算一次。</li>
          <li>三种算法结果一致，但效率差异明显。</li>
        </ul>
      </div>
    </div>
  );
}

