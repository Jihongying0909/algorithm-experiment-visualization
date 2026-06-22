import { Gauge } from 'lucide-react';
import { Step } from '../types';
import MetricCard from './MetricCard';

export default function StateMonitor({ step }: { step?: Step }) {
  if (!step) return <div className="warm-card p-4 text-[#7C6A5D]">等待运行数据。</div>;

  return (
    <div className="warm-card p-4 w-full h-full">
      <div className="flex items-center gap-2 text-lg font-semibold soft-title mb-2">
        <Gauge size={18} />
        状态监控
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MetricCard title="当前状态 K,N" value={`${step.currentState.eggs}, ${step.currentState.floors}`} />
        <MetricCard title="当前 x" value={step.x ?? '-'} />
        <MetricCard title="执行行" value={step.pseudoLine} />
        <MetricCard title="worst" value={step.worst ?? '-'} color="text-[#8a4f73]" />
        <MetricCard title="best / minTrials" value={step.best ?? '-'} color="text-[#44638f]" />
        <MetricCard title="bestFloor" value={step.bestFloor ?? '-'} color="text-[#44638f]" />
        <MetricCard title="调用次数" value={step.metrics?.calls ?? 0} color="text-[#5f4c95]" />
        <MetricCard title="memo 命中" value={step.metrics?.hits ?? 0} color="text-[#44638f]" />
        <MetricCard title="已计算状态数" value={step.metrics?.states ?? 0} />
        <MetricCard title="DP 已填格子" value={step.metrics?.filled ?? 0} />
      </div>
    </div>
  );
}
