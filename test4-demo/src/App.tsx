import { useEffect, useState } from 'react';
import ControlPanel from './components/ControlPanel';
import PseudocodePanel from './components/PseudocodePanel';
import VisualizationPanel from './components/VisualizationPanel';
import StateMonitor from './components/StateMonitor';
import StepExplanation from './components/StepExplanation';
import ExecutionLog from './components/ExecutionLog';
import CallStackPanel from './components/CallStackPanel';
import HeatmapView from './components/HeatmapView';
import ComparePanel from './components/ComparePanel';
import TeachingContent from './components/TeachingContent';
import RuntimeCharts from './components/RuntimeCharts';
import { pseudoMap } from './data/pseudocode';
import { Step } from './types';
import { generateBottomUpSteps, generateBruteForceSteps, generateReachDpSteps, generateTopDownSteps } from './utils/stepGenerators';

const limits = {
  bruteforce: { k: 12, n: 16 },
  topdown: { k: 12, n: 1743 },
  bottomup: { k: 12, n: 2767 },
  reach: { k: 8, n: 200 },
};

function ResultPanel({ step, status, total, currentIndex }: { step?: Step; status: string; total: number; currentIndex: number }) {
  if (!step) {
    return <div className="warm-subcard p-4 text-sm text-[#6f628f]">点击 Start 后显示实时结果。</div>;
  }

  const bestTrials = step.best ?? step.returnValue ?? '-';
  const firstFloor = step.bestFloor ?? '-';
  const isFinished = status === 'Finished' || (total > 0 && currentIndex === total - 1);

  return (
    <div className="warm-subcard p-4 text-sm">
      <div className="text-lg font-semibold soft-title mb-2">最终结果（实时更新）</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="warm-subcard p-3">
          <div className="text-xs soft-sub">当前最优试验次数</div>
          <div className="text-xl font-semibold text-[#3f4f8a]">{bestTrials}</div>
        </div>
        <div className="warm-subcard p-3">
          <div className="text-xs soft-sub">当前最优首投楼层</div>
          <div className="text-xl font-semibold text-[#7a4a69]">{firstFloor}</div>
        </div>
        <div className="warm-subcard p-3">
          <div className="text-xs soft-sub">进度状态</div>
          <div className="text-xl font-semibold text-[#5c4f78]">{isFinished ? '已完成' : '求解中'}</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-[#6f628f]">
        {isFinished ? `最终解：最少次数 ${bestTrials}，首投楼层 ${firstFloor}。` : `当前在第 ${currentIndex + 1}/${total} 步，结果会继续更新。`}
      </div>
    </div>
  );
}

export default function App() {
  const [k, setK] = useState(2);
  const [n, setN] = useState(6);
  const [algorithm, setAlgorithm] = useState<'bruteforce' | 'topdown' | 'bottomup' | 'reach'>('bruteforce');
  const [steps, setSteps] = useState<Step[]>([]);
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState<'Ready' | 'Running' | 'Paused' | 'Finished'>('Ready');
  const [tab, setTab] = useState<'table' | 'reach'>('table');
  const [bottomTab, setBottomTab] = useState<'explain' | 'log' | 'complexity' | 'result'>('explain');
  const [allCompare, setAllCompare] = useState<{ brute?: Step[]; top?: Step[]; bottom?: Step[] }>({});

  const current = steps[idx];
  const visited = new Set(steps.slice(0, idx + 1).map((s) => s.pseudoLine));

  useEffect(() => {
    if (status !== 'Running') return;
    const t = setInterval(() => {
      setIdx((p) => {
        if (p >= steps.length - 1) {
          setStatus('Finished');
          return p;
        }
        return p + 1;
      });
    }, 180);
    return () => clearInterval(t);
  }, [status, steps.length]);

  const start = () => {
    const limit = limits[algorithm];
    if (k > limit.k || n > limit.n) {
      alert('当前规模过大，建议使用较小参数进行可视化演示。');
      return;
    }
    const generated = algorithm === 'bruteforce'
      ? generateBruteForceSteps(k, n)
      : algorithm === 'topdown'
        ? generateTopDownSteps(k, n)
        : algorithm === 'bottomup'
          ? generateBottomUpSteps(k, n)
          : generateReachDpSteps(k, n);

    setSteps(generated);
    setIdx(0);
    setStatus('Ready');

    setTimeout(() => {
      setAllCompare({
        brute: generateBruteForceSteps(Math.min(k, 12), Math.min(n, 16)),
        top: generateTopDownSteps(Math.min(k, 12), Math.min(n, 1743)),
        bottom: generateBottomUpSteps(Math.min(k, 12), Math.min(n, 2767)),
      });
    }, 0);
  };

  const linesKey = algorithm === 'reach' ? 'bottomup' : algorithm;

  return (
    <div className="min-h-screen p-3 lg:p-4 bg-[#f7f5ff] text-[#43385a]">
      <ControlPanel
        k={k}
        n={n}
        setK={setK}
        setN={setN}
        algorithm={algorithm}
        setAlgorithm={setAlgorithm}
        step={steps.length ? idx + 1 : 0}
        total={steps.length}
        status={status}
        onStart={start}
        onPrev={() => { setStatus('Paused'); setIdx((v) => Math.max(0, v - 1)); }}
        onNext={() => { setStatus('Paused'); setIdx((v) => Math.min(Math.max(0, steps.length - 1), v + 1)); }}
        onPlay={() => setStatus('Running')}
        onPause={() => setStatus('Paused')}
        onReset={() => { setStatus('Ready'); setIdx(0); }}
      />

      <TeachingContent step={current} algorithm={algorithm} />

      <div className="grid grid-cols-1 xl:grid-cols-20 gap-3 mt-3 mb-4 items-start">
        <div className="xl:col-span-6">
          <PseudocodePanel lines={pseudoMap[linesKey]} current={current?.pseudoLine ?? 0} visited={visited} />
        </div>
        <div className="xl:col-span-9">
          <VisualizationPanel step={current} tab={tab} setTab={setTab} totalFloors={n} />
        </div>
        <div className="xl:col-span-5 flex flex-col gap-3">
          <StateMonitor step={current} />
          <CallStackPanel stack={current?.callStack} />
        </div>
      </div>

      <div className="warm-card mt-4 p-4 w-full relative">
        <div className="text-lg font-semibold soft-title mb-3">步骤信息</div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button onClick={() => setBottomTab('explain')} className={`px-3 py-1.5 text-sm rounded-xl border ${bottomTab === 'explain' ? 'soft-purple' : 'bg-[#fcfbff] border-[#e9e4f8]'}`}>当前解释</button>
          <button onClick={() => setBottomTab('log')} className={`px-3 py-1.5 text-sm rounded-xl border ${bottomTab === 'log' ? 'soft-blue' : 'bg-[#fcfbff] border-[#e9e4f8]'}`}>运行日志</button>
          <button onClick={() => setBottomTab('complexity')} className={`px-3 py-1.5 text-sm rounded-xl border ${bottomTab === 'complexity' ? 'soft-pink' : 'bg-[#fcfbff] border-[#e9e4f8]'}`}>复杂度说明</button>
          <button onClick={() => setBottomTab('result')} className={`px-3 py-1.5 text-sm rounded-xl border ${bottomTab === 'result' ? 'soft-blue' : 'bg-[#fcfbff] border-[#e9e4f8]'}`}>最终结果</button>
        </div>

        {bottomTab === 'explain' && <StepExplanation step={current} />}
        {bottomTab === 'log' && <ExecutionLog logs={current?.logs} />}
        {bottomTab === 'result' && <ResultPanel step={current} status={status} total={steps.length} currentIndex={idx} />}
        {bottomTab === 'complexity' && (
          <div className="warm-subcard p-4 text-sm leading-7 text-[#5c5077]">
            <div>蛮力法时间复杂度约为 O(N^(K-2) * 2^N)。</div>
            <div>自顶向下 DP：时间 O(KN²)，空间 O(KN)。</div>
            <div>自底向上 DP：时间 O(KN²)，空间 O(KN)。</div>
            <div>一维优化：reach[k] = reach[k] + reach[k-1] + 1。</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 mt-3 items-stretch">
        <div className="xl:col-span-4 h-full"><HeatmapView heat={current?.heatmap} /></div>
        <div className="xl:col-span-8 h-full"><ComparePanel brute={allCompare.brute} top={allCompare.top} bottom={allCompare.bottom} /></div>
      </div>

      <div className="mt-3 w-full">
        <RuntimeCharts steps={steps} currentIndex={idx} />
      </div>
    </div>
  );
}
