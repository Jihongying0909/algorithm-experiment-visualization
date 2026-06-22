import { Step } from '../types';

function toNum(v: unknown) {
  return typeof v === 'number' ? v : 0;
}

export default function RuntimeCharts({ steps, currentIndex }: { steps: Step[]; currentIndex: number }) {
  if (!steps.length) {
    return (
      <div className="warm-card p-4 w-full">
        <div className="text-lg font-semibold soft-title mb-1">实时结果图表</div>
        <div className="text-sm soft-sub">开始运行后，这里会实时更新调用次数、命中次数、重复次数曲线。</div>
      </div>
    );
  }

  const visible = steps.slice(0, currentIndex + 1);
  const points = visible.map((s, i) => ({
    i,
    calls: toNum(s.metrics?.calls),
    hits: toNum(s.metrics?.hits),
    states: toNum(s.metrics?.states),
    repeat: Math.max(0, toNum(s.metrics?.calls) - toNum(s.metrics?.states)),
  }));

  const maxY = Math.max(1, ...points.map((p) => Math.max(p.calls, p.hits, p.repeat)));
  const w = 560;
  const h = 180;
  const pad = 26;
  const x = (idx: number) => pad + (idx / Math.max(1, points.length - 1)) * (w - pad * 2);
  const y = (val: number) => h - pad - (val / maxY) * (h - pad * 2);

  const path = (key: 'calls' | 'hits' | 'repeat') =>
    points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${x(p.i)} ${y(p[key])}`)
      .join(' ');

  const last = points[points.length - 1];
  const repeatRate = last.calls > 0 ? ((last.repeat / last.calls) * 100).toFixed(1) : '0.0';

  return (
    <div className="warm-card p-4 w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold soft-title">实时结果图表（运行中自动更新）</div>
        <div className="text-xs soft-sub">Step {currentIndex + 1} / {steps.length}</div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
        <div className="warm-subcard p-2">调用次数<div className="text-lg font-semibold">{last.calls}</div></div>
        <div className="warm-subcard p-2">缓存命中<div className="text-lg font-semibold text-[#44638f]">{last.hits}</div></div>
        <div className="warm-subcard p-2">重复次数<div className="text-lg font-semibold text-[#8a4f73]">{last.repeat}</div></div>
        <div className="warm-subcard p-2">重复率<div className="text-lg font-semibold">{repeatRate}%</div></div>
      </div>

      <div className="warm-subcard p-2 overflow-auto">
        <svg width={w} height={h}>
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#cfc9de" />
          <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#cfc9de" />

          <path d={path('calls')} fill="none" stroke="#7c6f98" strokeWidth={2.2} />
          <path d={path('hits')} fill="none" stroke="#60a5fa" strokeWidth={2.2} />
          <path d={path('repeat')} fill="none" stroke="#f472b6" strokeWidth={2.2} />

          {points.length > 1 && (
            <>
              <circle cx={x(last.i)} cy={y(last.calls)} r={3.5} fill="#7c6f98" />
              <circle cx={x(last.i)} cy={y(last.hits)} r={3.5} fill="#60a5fa" />
              <circle cx={x(last.i)} cy={y(last.repeat)} r={3.5} fill="#f472b6" />
            </>
          )}
        </svg>
      </div>

      <div className="flex gap-3 mt-2 text-xs soft-sub">
        <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full bg-[#7c6f98]" />调用次数</span>
        <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full bg-[#60a5fa]" />缓存命中</span>
        <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full bg-[#f472b6]" />重复次数</span>
      </div>
    </div>
  );
}
