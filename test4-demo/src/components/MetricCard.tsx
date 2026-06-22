import { motion } from 'framer-motion';

export default function MetricCard({ title, value, color = 'text-[#4B3A2F]' }: { title: string; value: string | number; color?: string }) {
  return (
    <motion.div
      layout
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 0.25 }}
      className="warm-subcard p-3"
    >
      <div className="text-[11px] text-[#7C6A5D]">{title}</div>
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
    </motion.div>
  );
}
