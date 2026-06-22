import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Rocket, SlidersHorizontal } from 'lucide-react';
import { AlgoType } from '../types';

interface Props {
  k: number;
  n: number;
  setK: (v: number) => void;
  setN: (v: number) => void;
  algorithm: AlgoType;
  setAlgorithm: (v: AlgoType) => void;
  step: number;
  total: number;
  status: string;
  onStart: () => void;
  onPrev: () => void;
  onNext: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
}

const inputCls = 'h-10 rounded-xl border border-[#ddd0ff] bg-[#fcfbff] px-3 text-sm text-[#43385a] outline-none focus:ring-2 focus:ring-[#d7c8ff]';
const btnBase = 'h-10 px-3 rounded-xl text-sm font-semibold border transition-all duration-200 hover:-translate-y-0.5';

const statusClass: Record<string, string> = {
  Ready: 'soft-blue',
  Running: 'soft-purple',
  Paused: 'soft-pink',
  Finished: 'soft-blue',
};

export default function ControlPanel(p: Props) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl p-6 border border-[#e9e4f8] shadow-[0_10px_24px_rgba(114,102,158,0.15)] bg-gradient-to-r from-[#7c5cf0] via-[#a855f7] to-[#f472b6] text-white">
        <div className="inline-flex px-3 py-1 rounded-full border border-white/35 text-xs tracking-wide mb-4 bg-white/10">ALGORITHM DASHBOARD</div>
        <h1 className="text-4xl font-bold leading-tight">鸡蛋掉落问题算法可视化平台</h1>
        <p className="text-white/85 mt-2 text-sm">伪代码、递归树、DP 表与状态联动</p>
      </div>

      <div className="warm-card rounded-3xl p-4">
        <div className="flex items-center gap-2 text-lg font-semibold soft-title mb-3">
          <SlidersHorizontal size={18} />
          控制面板
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-end">
          <label className="text-xs soft-sub xl:col-span-2">
            Eggs
            <input type="number" min={1} value={p.k} onChange={(e) => p.setK(Number(e.target.value))} className={`${inputCls} w-full mt-1`} />
          </label>

          <label className="text-xs soft-sub xl:col-span-2">
            Floors
            <input type="number" min={0} value={p.n} onChange={(e) => p.setN(Number(e.target.value))} className={`${inputCls} w-full mt-1`} />
          </label>

          <label className="text-xs soft-sub xl:col-span-3">
            Algorithm
            <select value={p.algorithm} onChange={(e) => p.setAlgorithm(e.target.value as AlgoType)} className={`${inputCls} w-full mt-1`}>
              <option value="bruteforce">蛮力递归</option>
              <option value="topdown">自顶向下 DP</option>
              <option value="bottomup">自底向上 DP</option>
              <option value="reach">一维优化 Reach</option>
            </select>
          </label>

          <div className="xl:col-span-5 flex flex-wrap gap-2 xl:justify-end">
            <motion.button whileHover={{ scale: 1.03 }} className={`${btnBase} border-[#d8ccff] bg-gradient-to-r from-[#c4b5fd] to-[#93c5fd] text-[#2f2550]`} onClick={p.onStart}><Rocket size={13} className="inline mr-1" />Start</motion.button>
            <button className={`${btnBase} border-[#d6d7ff] bg-[#eef2ff] text-[#4b4f8c]`} onClick={p.onPrev}><SkipBack size={13} className="inline mr-1" />Prev</button>
            <button className={`${btnBase} border-[#d6d7ff] bg-[#eef2ff] text-[#4b4f8c]`} onClick={p.onNext}><SkipForward size={13} className="inline mr-1" />Next</button>
            <motion.button whileHover={{ scale: 1.03 }} className={`${btnBase} border-[#d8ccff] bg-gradient-to-r from-[#c4b5fd] to-[#93c5fd] text-[#2f2550]`} onClick={p.onPlay}><Play size={13} className="inline mr-1" />Play</motion.button>
            <button className={`${btnBase} border-[#f5cfe4] bg-[#fce7f3] text-[#8a4f73]`} onClick={p.onPause}><Pause size={13} className="inline mr-1" />Pause</button>
            <button className={`${btnBase} border-[#ddd0ff] bg-[#efe9ff] text-[#5f4c95]`} onClick={p.onReset}><RotateCcw size={13} className="inline mr-1" />Reset</button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-3 text-sm">
          <div className="soft-sub">Step {p.step}/{p.total}</div>
          <span className={`text-xs px-2.5 py-1 rounded-full border ${statusClass[p.status] ?? 'soft-blue'}`}>{p.status}</span>
        </div>
      </div>
    </div>
  );
}
