import { Step } from '../types';

export default function ComparePanel({ brute, top, bottom }: { brute?: Step[]; top?: Step[]; bottom?: Step[] }) {
  const last = (s?: Step[]) => (s && s.length > 0 ? s[s.length - 1] : undefined);
  const row = (name: string, s?: Step[]) => {
    const l = last(s);
    return {
      name,
      trials: l?.returnValue ?? '-',
      floor: l?.bestFloor ?? '-',
      calls: l?.metrics?.calls ?? '-',
      hits: l?.metrics?.hits ?? '-',
      states: l?.metrics?.states ?? '-',
    };
  };

  const rows = [row('Brute Force', brute), row('Top-Down DP', top), row('Bottom-Up DP', bottom)];

  return (
    <div className="warm-card p-4 overflow-auto w-full h-full">
      <div className="text-lg font-semibold soft-title mb-2">算法对比面板</div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[#7C6A5D]">
            <th className="text-left py-2">算法</th>
            <th className="text-left">最少次数</th>
            <th className="text-left">首投楼层</th>
            <th className="text-left">调用次数</th>
            <th className="text-left">缓存命中</th>
            <th className="text-left">状态数</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-[#E7D9C8] text-[#4B3A2F]">
              <td className="py-2">{r.name}</td>
              <td>{r.trials}</td>
              <td>{r.floor}</td>
              <td>{r.calls}</td>
              <td>{r.hits}</td>
              <td>{r.states}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
