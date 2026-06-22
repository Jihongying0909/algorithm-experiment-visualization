export default function HeatmapView({ heat }: { heat?: number[][] }) {
  if (!heat || heat.length === 0) return null;

  const cols = heat[0]?.length ?? 0;
  const flat = heat.flat().map(Number);
  const max = Math.max(1, ...flat);

  const color = (v: number) => {
    const t = v / max;
    return `rgba(96,165,250,${0.12 + t * 0.8})`;
  };

  return (
    <div className="warm-card p-4 bg-[#FFFDF9] w-full h-full">
      <div className="text-lg font-semibold soft-title mb-2">状态访问热力图</div>
      <div className="text-xs soft-sub mb-2">纵轴是 Eggs(K)，横轴是 Floors(N)</div>

      <div className="overflow-auto warm-subcard p-2">
        <table className="border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="px-2 py-1 text-[#7a6f98] border border-[#e7d9c8]">K\N</th>
              {Array.from({ length: cols }, (_, j) => (
                <th key={j} className="px-2 py-1 text-[#7a6f98] border border-[#e7d9c8] min-w-7">{j}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heat.map((row, i) => (
              <tr key={i}>
                <th className="px-2 py-1 text-[#7a6f98] border border-[#e7d9c8]">{i}</th>
                {row.map((v, j) => (
                  <td
                    key={`${i}-${j}`}
                    className="w-7 h-7 border border-[#e7d9c8] text-center"
                    style={{ background: color(Number(v)) }}
                    title={`K=${i}, N=${j}, visits=${v}`}
                  >
                    {v > 0 ? v : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs soft-sub">
        <span>访问强度：</span>
        <i className="w-4 h-3 rounded" style={{ background: 'rgba(96,165,250,0.15)' }} />
        <span>低</span>
        <i className="w-4 h-3 rounded" style={{ background: 'rgba(96,165,250,0.55)' }} />
        <span>中</span>
        <i className="w-4 h-3 rounded" style={{ background: 'rgba(96,165,250,0.92)' }} />
        <span>高</span>
      </div>
    </div>
  );
}
