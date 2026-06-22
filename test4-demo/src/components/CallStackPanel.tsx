import { Layers3 } from 'lucide-react';

export default function CallStackPanel({ stack = [] }: { stack?: string[] }) {
  return (
    <div className="warm-card p-4 w-full">
      <div className="flex items-center gap-2 text-lg font-semibold soft-title mb-2">
        <Layers3 size={18} />
        调用栈
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {stack.length === 0 && <span className="text-sm text-[#8C7A6E]">-</span>}
        {stack.map((item, i) => (
          <span key={`${item}-${i}`} className="contents">
            <span className={`px-2 py-1 rounded-full text-xs border ${i === stack.length - 1 ? 'bg-[#e8f2ff] border-[#60a5fa] text-[#365a86]' : 'bg-[#f7f3ff] border-[#ddd0ff] text-[#6D5A94]'}`}>{item}</span>
            {i < stack.length - 1 && <span className="text-[#9A6B4A]">→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
