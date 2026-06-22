import { AnimatePresence, motion } from 'framer-motion';

export default function ExecutionLog({ logs = [] }: { logs?: string[] }) {
  return (
    <div className="warm-card p-4 h-72 overflow-auto bg-[#FFFDF9]">
      <div className="text-sm font-semibold soft-title mb-2">运行日志</div>
      <AnimatePresence>
        {logs.map((l, i) => (
          <motion.div
            key={`${l}-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-xs p-2 rounded-lg mb-1 ${i === logs.length - 1 ? 'bg-[#e8f2ff] text-[#2c4f77]' : 'bg-[#f7f3ff] text-[#5c4f78]'}`}
          >
            {l}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
