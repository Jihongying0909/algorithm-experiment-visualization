import { motion } from 'framer-motion';
import { Step } from '../types';

interface Props {
  step: Step;
  compact?: boolean;
}

export default function ReachArrayView({ step, compact = false }: Props) {
  const arr = step.reach ?? [];
  const currentK = step.currentState.eggs;
  const depK = currentK - 1;
  const m = step.best ?? 0;
  const n = step.currentState.floors;
  const cover = arr.length > 0 ? arr[arr.length - 1] : 0;

  return (
    <div className={`warm-subcard ${compact ? 'p-3' : 'p-4'}`}>
      <div className="text-lg font-semibold soft-title mb-2">一维 Reach</div>
      <div className="text-sm text-[#5c5077] font-mono mb-2">reach[k] = reach[k] + reach[k-1] + 1</div>
      <div className="text-xs soft-sub mb-3">当前 m={m}，覆盖进度 {cover}/{n}</div>

      <div className="overflow-auto">
        <div className="flex items-end gap-2 min-w-max pb-1">
          {arr.map((v, i) => {
            const isCurrent = i === currentK;
            const isDep = i === depK;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="text-xs text-[#7a6f98] font-medium">{`R(${i})`}</div>
                <motion.div
                  animate={{ scale: isCurrent ? [1, 1.08, 1] : 1 }}
                  transition={{ duration: 0.25 }}
                  className={`w-16 h-12 rounded-xl border flex items-center justify-center text-lg font-semibold ${
                    isCurrent
                      ? 'bg-[#e8f2ff] border-[#60a5fa] text-[#2d4f77]'
                      : isDep
                        ? 'bg-[#fce7f3] border-[#f5cfe4] text-[#7a4a69]'
                        : 'bg-[#fffdf9] border-[#e7d9c8] text-[#5e4a3d]'
                  }`}
                >
                  {v}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs soft-sub">
        <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded border border-[#f5cfe4] bg-[#fce7f3]" />依赖项 reach[k-1]</span>
        <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded border border-[#60a5fa] bg-[#e8f2ff]" />当前计算 reach[k]</span>
      </div>
    </div>
  );
}
