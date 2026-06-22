import { motion } from 'framer-motion';
import { Code2 } from 'lucide-react';
import { PseudoLine } from '../types';

export default function PseudocodePanel({ lines, current, visited }: { lines: PseudoLine[]; current: number; visited: Set<number> }) {
  return (
    <div className="warm-card bg-[#fffbff] h-[620px] overflow-auto p-4 rounded-2xl">
      <div className="flex items-center gap-2 text-lg font-semibold soft-title mb-3">
        <Code2 size={18} />
        伪代码
      </div>
      {lines.map((l) => (
        <motion.div
          key={l.line}
          title={l.tip}
          layout
          transition={{ duration: 0.2 }}
          className={`font-mono text-sm rounded-lg px-3 py-1.5 mb-1 border-l-4 ${
            current === l.line
              ? 'bg-[#e8f2ff] border-l-[#60a5fa] text-[#334155]'
              : visited.has(l.line)
                ? 'bg-[#fce7f3] border-l-transparent text-[#6b5a74]'
                : 'bg-transparent border-l-transparent text-[#5e4a68]'
          }`}
        >
          <span className="text-[#A08B7A] mr-3">{l.line}</span>
          {l.text}
        </motion.div>
      ))}
    </div>
  );
}
